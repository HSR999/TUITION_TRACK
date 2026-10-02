self.addEventListener("push", (event) => {
  let notification = {};
  try {
    notification = event.data ? event.data.json() : {};
  } catch {
    notification = { title: "TuitionTrack", body: event.data?.text() || "You have a fee update." };
  }

  event.waitUntil(self.registration.showNotification(notification.title || "TuitionTrack", {
    body: notification.body || "You have a fee update.",
    icon: "/icons/logo.png",
    badge: "/icons/logo.png",
    data: { url: notification.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  }));
});
