import { AlertTriangle, CheckCircle, Info, Loader2, Search, ShoppingCart, User } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Navigation } from '@/app/_common/components/navigation';
import constants from '@/config/constants';
import { env } from '@/libs/env';
import { apiCaller } from '@/libs/restClient';
import { scriptsUrls } from '@/libs/restClient/api/scripts/urls';

type Props = {
  params: Promise<{
    tenantId: string;
  }>;
};

export default async function Page({ params: promiseParams }: Props) {
  const params = await promiseParams;
  const tenantId = Number(params.tenantId);

  const tenantResponse = await apiCaller.tenants.get({ pathParams: { tenantId } });
  if (!tenantResponse.ok) return redirect(constants.pages.tenants());
  const tenant = await tenantResponse.json();

  return (
    <Navigation
      tenant={tenant}
      breadcrumb={[{ name: 'Tenants', path: constants.pages.tenants() }, { name: tenant.name, path: constants.pages.tenant({ tenantId }) }, { name: 'Playground' }]}
    >
      <script type="module" src={`${env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE}${scriptsUrls.get({ pathParams: { tenantId } })}`}></script>
      <div className="bg-gray-100">
        {/* Header */}
        <header id="header" className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h1 id="logo" className="text-2xl font-bold text-indigo-600">
                  AB Tester
                </h1>
                <nav id="main-nav" className="flex space-x-6">
                  <button type="button" id="nav-home" className="text-gray-700 hover:text-indigo-600">
                    Home
                  </button>
                  <button type="button" id="nav-products" className="text-gray-700 hover:text-indigo-600">
                    Products
                  </button>
                  <button type="button" id="nav-offers" className="text-gray-700 hover:text-indigo-600">
                    Offers
                  </button>
                  <button type="button" id="nav-contact" className="text-gray-700 hover:text-indigo-600">
                    Contact
                  </button>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <button type="button" id="search-icon" className="text-gray-700 hover:text-indigo-600">
                  <Search />
                </button>
                <button type="button" id="user-icon" className="text-gray-700 hover:text-indigo-600">
                  <User />
                </button>
                <button type="button" id="cart-icon" className="relative text-gray-700 hover:text-indigo-600">
                  <ShoppingCart />
                  <span id="cart-badge" className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div id="search-bar-section" className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="button" id="search-button" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div id="filters-section" className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Category</span>
              <select id="category-filter" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All</option>
                <option>Laptops</option>
                <option>Phones</option>
                <option>Tablets</option>
                <option>Accessories</option>
              </select>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Price</span>
              <select id="price-filter" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Any</option>
                <option>$0 - $500</option>
                <option>$500 - $1000</option>
                <option>$1000+</option>
              </select>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">Brand</span>
              <input
                id="brand-filter"
                type="text"
                placeholder="Filter by brand"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" id="stock-filter" className="w-4 h-4 text-indigo-600" />
              <span className="ml-2 text-sm text-gray-700">In stock only</span>
            </div>
            <button type="button" id="clear-filters" className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Clear filters
            </button>
          </div>
        </div>

        {/* Test Banner */}
        <div id="test-banner" className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <AlertTriangle />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">A/B TEST DEMO PAGE</span> - This is a static demo page for testing. No buttons or features are functional.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div id="main-content" className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
              <CheckCircle />
            </div>
            <h2 id="main-title" className="text-4xl font-bold text-gray-900 mb-4">
              A/B Testing Demo Page
            </h2>
            <p id="main-description" className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              This static page is designed to test different interface elements, buttons, and forms without any real functionality.
            </p>
            <div id="variant-badge" className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Info />
              <span className="text-sm text-blue-800 font-medium">Test variant: Control v1.0</span>
            </div>
          </div>

          {/* Sample Actions Grid */}
          <div id="actions-grid" className="grid grid-cols-3 gap-6 mb-12">
            <div id="primary-actions" className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent hover:border-indigo-500 transition-colors">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Primary Actions</h3>
              <div className="space-y-2">
                <button type="button" id="primary-action-1" className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Primary Action 1
                </button>
                <button type="button" id="primary-action-2" className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Primary Action 2
                </button>
                <button type="button" id="primary-action-3" className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Primary Action 3
                </button>
              </div>
            </div>

            <div id="secondary-actions" className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent hover:border-green-500 transition-colors">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Secondary Actions</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  id="secondary-action-1"
                  className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Secondary Action 1
                </button>
                <button
                  type="button"
                  id="secondary-action-2"
                  className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Secondary Action 2
                </button>
                <button
                  type="button"
                  id="secondary-action-3"
                  className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Secondary Action 3
                </button>
              </div>
            </div>

            <div id="alert-actions" className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent hover:border-red-500 transition-colors">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Alert Actions</h3>
              <div className="space-y-2">
                <button type="button" id="alert-action-1" className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Alert Action 1
                </button>
                <button type="button" id="warning-action" className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                  Warning Action
                </button>
                <button type="button" id="success-action" className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Success Action
                </button>
              </div>
            </div>
          </div>

          {/* Form Testing Section */}
          <div id="test-form" className="bg-white p-8 rounded-lg shadow-md mb-12">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Test Form</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Full name</span>
                <input
                  id="form-name"
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Email</span>
                <input
                  id="form-email"
                  type="email"
                  placeholder="name@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Phone</span>
                <input
                  id="form-phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Date</span>
                <input id="form-date" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Price range</span>
                <input id="form-range" type="range" min="0" max="1000" className="w-full" />
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Preferred color</span>
                <input id="form-color" type="color" className="w-full h-10 border border-gray-300 rounded-lg" />
              </div>
              <div className="col-span-2">
                <span className="block text-sm font-medium text-gray-700 mb-2">Message</span>
                <textarea
                  id="form-message"
                  rows={4}
                  placeholder="Write your message here..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2 space-y-3">
                <div className="flex items-center">
                  <input type="checkbox" id="form-terms" className="w-4 h-4 text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-700">I agree to the terms and conditions</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="form-newsletter" className="w-4 h-4 text-indigo-600" />
                  <span className="ml-2 text-sm text-gray-700">I would like to receive news and promotions</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="radio" name="plan" id="form-plan-basic" className="w-4 h-4 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Basic Plan</span>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" name="plan" id="form-plan-premium" className="w-4 h-4 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Premium Plan</span>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" name="plan" id="form-plan-enterprise" className="w-4 h-4 text-indigo-600" />
                    <span className="ml-2 text-sm text-gray-700">Enterprise Plan</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex gap-4">
                <button type="button" id="form-submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                  Submit Form
                </button>
                <button type="button" id="form-cancel" className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Button Variations */}
          <div id="button-variations" className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Button Variations for Testing</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sizes</h4>
                <div className="flex flex-wrap gap-3">
                  <button type="button" id="btn-size-small" className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                    Small
                  </button>
                  <button type="button" id="btn-size-medium" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Medium
                  </button>
                  <button type="button" id="btn-size-large" className="px-6 py-3 bg-indigo-600 text-white text-lg rounded hover:bg-indigo-700">
                    Large
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Styles</h4>
                <div className="flex flex-wrap gap-3">
                  <button type="button" id="btn-style-solid" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Solid
                  </button>
                  <button type="button" id="btn-style-outline" className="px-4 py-2 border-2 border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50">
                    Outline
                  </button>
                  <button type="button" id="btn-style-text" className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded">
                    Text
                  </button>
                  <button
                    type="button"
                    id="btn-style-gradient"
                    className="px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded hover:from-indigo-700 hover:to-purple-700"
                  >
                    Gradient
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">States</h4>
                <div className="flex flex-wrap gap-3">
                  <button type="button" id="btn-state-normal" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Normal
                  </button>
                  <button type="button" id="btn-state-disabled" className="px-4 py-2 bg-indigo-600 text-white rounded opacity-50 cursor-not-allowed">
                    Disabled
                  </button>
                  <button type="button" id="btn-state-loading" className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center">
                    <Loader2 />
                    Loading
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div id="newsletter-section" className="bg-indigo-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 id="newsletter-title" className="text-3xl font-bold mb-2">
                Subscribe to our newsletter
              </h2>
              <p id="newsletter-description" className="text-indigo-200">
                Get exclusive offers and updates
              </p>
            </div>
            <div className="max-w-md mx-auto flex gap-2">
              <input id="newsletter-email" type="email" placeholder="you@example.com" className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none" />
              <button type="button" id="newsletter-submit" className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 font-semibold">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer id="footer" className="bg-gray-900 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-4 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">About Us</h3>
                <ul className="space-y-2">
                  <li>
                    <button type="button" className="hover:text-white">
                      Who We Are
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Careers
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Press
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Help</h3>
                <ul className="space-y-2">
                  <li>
                    <button type="button" className="hover:text-white">
                      Frequently Asked Questions
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Shipping
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Returns
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Warranty
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Contact</h3>
                <ul className="space-y-2">
                  <li>
                    <button type="button" className="hover:text-white">
                      Support
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Live chat
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-white">
                      Email
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <button type="button" className="hover:text-white">
                    Facebook
                  </button>
                  <button type="button" className="hover:text-white">
                    Twitter
                  </button>
                  <button type="button" className="hover:text-white">
                    Instagram
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p>© 2026 AB Tester. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Navigation>
  );
}
