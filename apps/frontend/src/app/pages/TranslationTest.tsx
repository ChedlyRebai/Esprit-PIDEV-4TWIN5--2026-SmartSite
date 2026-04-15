import { useTranslation } from "@/app/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TranslationTest() {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Translation Test Page</h1>
        <p className="text-gray-500">Current Language: <strong>{language.toUpperCase()}</strong></p>
        <p className="text-sm text-blue-600 mt-4">
          💡 Change the language using the selector in the top-right corner and watch this page update!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Auth Section */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Login Title:</strong> {t("auth.login.title")}</p>
            <p><strong>Email Label:</strong> {t("auth.login.email")}</p>
            <p><strong>Password Label:</strong> {t("auth.login.password")}</p>
            <p><strong>Sign In Button:</strong> {t("auth.login.signIn")}</p>
          </CardContent>
        </Card>

        {/* Navigation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Product:</strong> {t("nav.product")}</p>
            <p><strong>Features:</strong> {t("nav.features")}</p>
            <p><strong>Resources:</strong> {t("nav.resources")}</p>
            <p><strong>Company:</strong> {t("nav.company")}</p>
          </CardContent>
        </Card>

        {/* Dashboard Section */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Title:</strong> {t("dashboard.title")}</p>
            <p><strong>Projects:</strong> {t("dashboard.projects")}</p>
            <p><strong>Sites:</strong> {t("dashboard.sites")}</p>
            <p><strong>Team:</strong> {t("dashboard.team")}</p>
          </CardContent>
        </Card>

        {/* Common Section */}
        <Card>
          <CardHeader>
            <CardTitle>Common Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Save:</strong> {t("common.save")}</p>
            <p><strong>Cancel:</strong> {t("common.cancel")}</p>
            <p><strong>Delete:</strong> {t("common.delete")}</p>
            <p><strong>Loading:</strong> {t("common.loading")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Language Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-bold mb-2">How to Use Translations in Your Pages:</h3>
          <ol className="list-decimal ml-6 space-y-2 text-sm">
            <li>Import: <code className="bg-slate-100 px-2 py-1 rounded">import {'{t, language}'} from "@/app/hooks/useTranslation"</code></li>
            <li>Use in component: <code className="bg-slate-100 px-2 py-1 rounded">const {'{t, language}'} = useTranslation()</code></li>
            <li>Display text: <code className="bg-slate-100 px-2 py-1 rounded">{'{t("key.path")}'}</code></li>
            <li>Language automatically updates on all pages that use useTranslation()</li>
          </ol>
        </CardContent>
      </Card>

      {/* Available Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            <li>🇬🇧 English (en)</li>
            <li>🇫🇷 Français (fr)</li>
            <li>🇹🇳 العربية (ar)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
