'use client';

import { Eye, EyeOff, Lock, LucideIcon, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { FieldValues, Path, UseFormRegister, useForm } from 'react-hook-form';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import { apiCaller } from '@/libs/restClient';

type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type ProfileForm = {
  name: string;
  email: string;
};

type InputProps<T extends FieldValues> = {
  label: string;
  icon: LucideIcon;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
};

const InputField = <T extends FieldValues>({ label, icon: Icon, type = 'text', placeholder, register, name }: InputProps<T>) => {
  const [show, setShow] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400">
          <Icon size={16} />
        </div>
        <input
          type={inputType}
          placeholder={placeholder}
          {...register(name)}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all placeholder-gray-300"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) => (
  <div className="flex items-center gap-3 px-6 py-4 bg-gray-100 border-b border-gray-100">
    <div className="bg-blue-600 rounded-lg p-1.5">
      <Icon size={15} className="text-white" />
    </div>
    <div>
      <h2 className="text-sm font-semibold text-gray-800 leading-tight">{title}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  </div>
);

function PasswordFormComponent() {
  const { translation } = useTranslationContext();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, watch, reset: resetPassword } = useForm<PasswordForm>();

  const newPassword = watch('newPassword');
  const confirmNewPassword = watch('confirmNewPassword');

  const newPasswordsAreEqual = newPassword === confirmNewPassword;

  const onSubmitPassword = async (result: PasswordForm) => {
    await apiCaller.users.updatePassword({ body: { newPassword: result.newPassword, oldPassword: result.oldPassword } });
    resetPassword();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <SectionTitle icon={Lock} title={translation.account.changePassword} subtitle={translation.account.passwordSubtitle} />
      <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="p-6 flex flex-col gap-4">
        <InputField<PasswordForm> label={translation.account.currentPassword} icon={Lock} type="password" register={registerPassword} name="oldPassword" />
        <InputField<PasswordForm> label={translation.account.newPassword} icon={Lock} type="password" register={registerPassword} name="newPassword" />
        <InputField<PasswordForm>
          label={translation.account.confirmNewPassword}
          icon={Lock}
          type="password"
          placeholder={translation.account.enterNewPasswordAgain}
          register={registerPassword}
          name="confirmNewPassword"
        />
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!newPasswordsAreEqual || newPassword?.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {translation.account.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileFormComponent() {
  const { translation } = useTranslationContext();
  const user = useUser();
  const { register: registerProfile, handleSubmit: handleSubmitProfile } = useForm<ProfileForm>({
    defaultValues: {
      email: user.data?.email,
      name: user.data?.name,
    },
  });

  const onSubmitProfile = async (result: ProfileForm) => {
    await apiCaller.users.updateAccount({ body: { email: result.email, name: result.name } });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <SectionTitle icon={User} title={translation.account.profileInformation} subtitle={translation.account.profileSubtitle} />
      <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="p-6 flex flex-col gap-4">
        <InputField<ProfileForm> label={translation.account.fullName} icon={User} placeholder={translation.account.sampleName} register={registerProfile} name="name" />
        <InputField<ProfileForm>
          label={translation.account.emailAddress}
          icon={Mail}
          type="email"
          placeholder={translation.account.emailPlaceholder}
          register={registerProfile}
          name="email"
        />
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {translation.account.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { translation } = useTranslationContext();
  return (
    <div className="bg-gray-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{translation.account.settings}</h1>
          <p className="text-gray-400 text-sm mt-1">{translation.account.manageAccountPreferences}</p>
        </div>
        <div className="flex flex-col gap-4">
          <ProfileFormComponent />
          <PasswordFormComponent />
        </div>
      </div>
    </div>
  );
}
