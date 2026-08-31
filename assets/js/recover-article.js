(function () {
  'use strict';
  const match = location.pathname.match(/^\/(?:haber|paylas)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-[a-z0-9]+)?\.html$/i);
  if (!match) return; // Gerçek 404 ve kaldırılmış demo adresleri yönlendirilmez.
  location.replace('/haber-onizleme.html?id=' + encodeURIComponent(match[1]));
}());
