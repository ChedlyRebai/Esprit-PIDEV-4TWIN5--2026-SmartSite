import { Bell, CheckCircle, AlertTriangle, Info, X, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  getMyNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
} from "@/app/action/notification.action";
import { useTranslation } from "@/app/hooks/useTranslation";

export default function Notifications() {
  const { t, language } = useTranslation();
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const handleMarkAllAsRead = () => {
    toast.success(
      t("notifications.toastMarkedRead", "All notifications marked as read"),
    );
  };

  const handleClearAll = () => {
    toast.success(t("notifications.toastCleared", "All notifications cleared"));
  };

  const handleDeleteNotification = (id: number) => {
    toast.success(t("notifications.toastRemoved", "Notification removed"));
  };

  const { data: myNotifcations } = useQuery({
    queryKey: ["myNotifications"],
    queryFn: () => getMyNotifications(),
  });

  const { data: UnreadNotifCount } = useQuery({
    queryKey: ["unreadNotificationsLength"],
    queryFn: () => getUnreadNotificationCount(),
  });

  const { data: unreadNotifs } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: () => getUnreadNotifications(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("notifications.title", "Notifications")}
          </h1>
          <p className="text-gray-500 mt-1">
            {t(
              "notifications.subtitle",
              "Stay updated with alerts and announcements",
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={UnreadNotifCount === 0}
          >
            {t("notifications.markAllRead", "Mark All as Read")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("notifications.centerTitle", "Notification Center")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread">
                {t("notifications.tabUnread", "Unread")} ({UnreadNotifCount || 0})
              </TabsTrigger>
              <TabsTrigger value="all">
                {t("notifications.tabAll", "All Notifications")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="space-y-3 mt-4">
              {unreadNotifs && unreadNotifs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>{t("notifications.emptyUnread", "No unread notifications")}</p>
                </div>
              ) : (
                unreadNotifs && unreadNotifs.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg ${getBackgroundColor(notification.type)}`}
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.qhseNotes && (
                            <div className="mt-2 p-2 bg-white/50 rounded text-xs text-gray-700">
                              <span className="font-semibold">Reason:</span> {notification.qhseNotes}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString(
                              language === "fr"
                                ? "fr-FR"
                                : language === "ar"
                                  ? "ar-TN"
                                  : "en-GB",
                            )}
                          </p>
                        </div>
                        <Badge
                          variant={
                            notification.type === "critical"
                              ? "destructive"
                              : notification.type === "warning"
                                ? "destructive"
                                : notification.type === "success"
                                  ? "secondary"
                                  : "default"
                          }
                        >
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-3 mt-4">
              {myNotifcations && [...myNotifcations].map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg ${
                    notification.read
                      ? "bg-gray-50 opacity-75"
                      : getBackgroundColor(notification.type)
                  }`}
                  onClick={() => setSelectedNotification(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${notification.read ? "text-gray-600" : "text-gray-900"}`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.qhseNotes && (
                          <div className="mt-2 p-2 bg-white/50 rounded text-xs text-gray-700">
                            <span className="font-semibold">Reason:</span> {notification.qhseNotes}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString(
                            language === "fr"
                              ? "fr-FR"
                              : language === "ar"
                                ? "ar-TN"
                                : "en-GB",
                          )}
                        </p>
                      </div>
                      <Badge
                        variant={
                          notification.type === "critical"
                            ? "destructive"
                            : notification.type === "warning"
                              ? "destructive"
                              : notification.type === "success"
                                ? "secondary"
                                : "default"
                        }
                      >
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notification Detail Modal */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getIcon(selectedNotification?.type)}
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">{selectedNotification?.message}</p>
            {selectedNotification?.qhseNotes && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs font-semibold text-orange-700 mb-1">Rejection reason :</p>
                <p className="text-sm text-orange-700">{selectedNotification.qhseNotes}</p>
              </div>
            )}
            <p className="text-xs text-gray-400">
              {selectedNotification && new Date(selectedNotification.createdAt).toLocaleString(
                language === "fr" ? "fr-FR" : language === "ar" ? "ar-TN" : "en-GB",
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
