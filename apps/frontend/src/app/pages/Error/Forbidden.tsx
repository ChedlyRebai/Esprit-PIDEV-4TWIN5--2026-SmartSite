import { useTranslation } from "@/app/hooks/useTranslation";

export default function Forbidden() {
  const { t } = useTranslation();
  // const router = useRouter();
  return (
    <>
      <div className="bg-white h-screen flex flex-col lg:relative">
        <div className="grow flex flex-col">
          <main className="grow flex flex-col bg-white">
            <div className="grow mx-auto max-w-7xl w-full flex flex-col px-4 sm:px-6 lg:px-8">
              <div className="shrink-0 pt-10 sm:pt-16">
                <a href="/" className="inline-flex">
                  <span className="sr-only">Workflow</span>
                  <img
                    className="h-12 w-auto"
                    src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
                    alt=""
                  />
                </a>
              </div>
              <div className="shrink-0 my-auto py-16 sm:py-32">
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                  403 error
                </p>
                <h1 className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
                  Access denied
                </h1>
                <p className="mt-2 text-base text-gray-500">
                  You do not have permission to access this page.
                </p>
                <div className="mt-6">
                  <a
                    href="/"
                    className="text-base font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Go Back<span aria-hidden="true"> &rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          </main>
         
        </div>
        <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1470847355775-e0e3c35a9a2c?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1825&q=80"
            alt=""
          />
        </div>
      </div>
    </>
  );
}
