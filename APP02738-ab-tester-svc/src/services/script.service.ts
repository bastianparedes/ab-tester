import fs from 'node:fs';
import type { TypeNodeRequirement } from '@ab-tester/constants/types/campaign';
import type { TypeCampaignScript } from '@ab-tester/constants/types/script';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import { env } from '../libs/env';
import { getScriptLocation } from '../libs/script';
import { AudienceRepository } from '../repositories/audience.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { ExecutionGroupRepository } from '../repositories/executionGroup.repository';
import { LifecycleHookRepository } from '../repositories/lifecycleHook.repository';
import { TrackEventRepository } from '../repositories/trackEvent.repository';
import scriptConstants from '../script/config/constants';
import { TypeAbTester } from '../script/types';
import { CacheService } from './cache.service';

const getMinifiedHtml = async (html: string): Promise<string> => {
  try {
    const minifiedHtml = await minifyHtml(html, {
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeAttributeQuotes: false,
      removeComments: true,
    });
    return minifiedHtml;
  } catch (err) {
    console.error('Error al minificar HTML:', err);
    return '';
  }
};
const getMinifiedCss = (css: string): string => {
  const output = new CleanCSS({
    level: 2,
  }).minify(css);

  if (output.errors.length) return '';
  return output.styles;
};
const getMinifiedJs = async (js: string) => {
  const result = await minifyJs(js, {
    compress: {
      drop_console: false,
      drop_debugger: true,
      passes: 2,
      pure_funcs: ['alert'],
    },
    format: {
      comments: false,
    },
    mangle: true,
  });

  return result.code ?? '';
};
const stringifyWithFunctions = (obj: unknown): string => {
  if (typeof obj === 'function') {
    return obj.toString();
  }

  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => stringifyWithFunctions(item));
    return `[${items.join(', ')}]`;
  }

  const entries = Object.entries(obj).map(([key, value]) => {
    return `${key}: ${stringifyWithFunctions(value)}`;
  });

  return `{${' '.repeat(2)}${entries.join(`, ${' '.repeat(2)}`)}}`;
};

const getFunctionFromAsyncArrowFromStringFunction = async (stringFunction: string) => {
  const result = await minifyJs(stringFunction, {
    compress: false,
    format: { comments: false, semicolons: false },
    mangle: false,
  });

  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  const fn = new AsyncFunction([], 'return;');

  fn.toString = () => result.code ?? 'async () => {}';
  return fn;
};

@Injectable()
export class ScriptService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly executionGroupRepository: ExecutionGroupRepository,
    private readonly trackEventRepository: TrackEventRepository,
    private readonly audienceRepository: AudienceRepository,
    private readonly lifecycleHookRepository: LifecycleHookRepository,
    private readonly cacheService: CacheService,
  ) {}

  private async getCampaigns({ tenantId }: { tenantId: number }): Promise<TypeCampaignScript[]> {
    const campaigns = await this.campaignRepository.getAllCampaignsForScript({ tenantId });
    const campaignsWithFunctions = await Promise.all(
      campaigns.map(async (campaign) => {
        const migrateRequirementsFromStringToFunction = async (requirement: TypeNodeRequirement): Promise<TypeCampaignScript['requirements']> => {
          return {
            ...requirement,
            data: {
              ...requirement.data,
              children: await Promise.all(
                requirement.data.children.map(async (childRequirement) => {
                  if (childRequirement.type === 'node') return migrateRequirementsFromStringToFunction(childRequirement);
                  if (childRequirement.type === 'custom') {
                    const javascript = await getFunctionFromAsyncArrowFromStringFunction(childRequirement.data.javascript);

                    return {
                      ...childRequirement,
                      data: {
                        ...childRequirement.data,
                        javascript,
                      },
                    };
                  }
                  return childRequirement;
                }),
              ),
            },
          };
        };

        const newRequirements = await migrateRequirementsFromStringToFunction(campaign.requirements);
        const newTriggers = await Promise.all(
          campaign.triggers.map(async (trigger) => {
            if (trigger.type === 'custom') {
              const javascript = await getFunctionFromAsyncArrowFromStringFunction(trigger.data.javascript);

              return {
                ...trigger,
                data: {
                  ...trigger.data,
                  javascript,
                },
              };
            }
            return trigger;
          }),
        );
        const newVariations = await Promise.all(
          campaign.variations.map(async (variation) => {
            const javascript = await getFunctionFromAsyncArrowFromStringFunction(variation.javascript);
            return {
              ...variation,
              css: getMinifiedCss(variation.css),
              html: await getMinifiedHtml(variation.html),
              javascript,
            };
          }),
        );

        return {
          ...campaign,
          requirements: newRequirements,
          triggers: newTriggers,
          variations: newVariations,
        };
      }),
    );

    return campaignsWithFunctions;
  }

  private async getExecutionGroups({ tenantId }: { tenantId: number }) {
    const executionGroups = await this.executionGroupRepository.getAllExecutionGroupsForScript({ tenantId });
    return executionGroups;
  }

  private async getTrackEvents({ tenantId }: { tenantId: number }) {
    const trackEvents = await this.trackEventRepository.getAllTrackEventsForScript({ tenantId });
    const trackEventsWithFunctions = await Promise.all(
      trackEvents.map(async (trackEvent) => {
        const javascript = await getFunctionFromAsyncArrowFromStringFunction(trackEvent.javascript);
        return {
          ...trackEvent,
          javascript,
        };
      }),
    );
    return trackEventsWithFunctions;
  }

  private async getAudiences({ tenantId }: { tenantId: number }) {
    const audiences = await this.audienceRepository.getAllAudiencesForScript({ tenantId });
    return audiences;
  }

  private async getLifecycleHooks({ tenantId }: { tenantId: number }): Promise<TypeAbTester['lifecycleHooksData']> {
    const lifecycleHooks = await this.lifecycleHookRepository.getAllLifecycleHooksForScript({ tenantId });
    const lifecycleHooksWithFunctions = await Promise.all(
      lifecycleHooks.map(async (lifecycleHook) => {
        const javascript = await getFunctionFromAsyncArrowFromStringFunction(lifecycleHook.javascript);

        return { ...lifecycleHook, javascript };
      }),
    );
    const lifecycleHooksByOption: TypeAbTester['lifecycleHooksData'] = {
      campaignEnd: [],
      campaignStart: [],
      executionGroupEnd: [],
      executionGroupStart: [],
      scriptEnd: [],
      scriptStart: [],
      trackEventEnd: [],
      trackEventStart: [],
      variantCampaignEnd: [],
      variantCampaignStart: [],
    };

    for (const lifecycleHook of lifecycleHooksWithFunctions) {
      lifecycleHooksByOption[lifecycleHook.option].push(lifecycleHook);
    }

    return lifecycleHooksByOption;
  }

  private async generateScript({ tenantId }: { tenantId: number }): Promise<string> {
    const scriptLocation = getScriptLocation();
    const fileExists = fs.existsSync(scriptLocation);
    if (!fileExists) throw new InternalServerErrorException();

    const [campaignsData, executionGroupsData, trackEventsData, audiencesData, lifecycleHooksData] = await Promise.all([
      this.getCampaigns({ tenantId }),
      this.getExecutionGroups({ tenantId }),
      this.getTrackEvents({ tenantId }),
      this.getAudiences({ tenantId }),
      this.getLifecycleHooks({ tenantId }),
    ]);

    const serviceBaseUrl = env.SERVICE_BASE_URL;

    const windowObject: TypeAbTester = { audiencesData, campaignsData, executionGroupsData, lifecycleHooksData, serviceBaseUrl, trackEventsData };
    const stringWindow = `window.${scriptConstants.windowKey} = ${stringifyWithFunctions(windowObject)};`;
    const script = fs.readFileSync(scriptLocation, 'utf-8');
    const fullScript = stringWindow + script;
    const minifiedJs = await getMinifiedJs(fullScript);
    return minifiedJs;
  }

  async populateScript({ tenantId }: { tenantId: number }): Promise<string> {
    const script = await this.generateScript({ tenantId });
    await this.cacheService.scripts.save({ code: script, tenantId });
    return script;
  }

  async clear({ tenantId }: { tenantId: number }): Promise<void> {
    await this.cacheService.scripts.del({ tenantId });
  }

  async getScript({ tenantId }: { tenantId: number }): Promise<string> {
    const cachedScript = await this.cacheService.scripts.get({ tenantId });
    if (cachedScript) return cachedScript;

    const script = await this.generateScript({ tenantId });
    await this.cacheService.scripts.save({ code: script, tenantId });
    return script;
  }
}
