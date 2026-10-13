/* Admin console auth: JWT in localStorage, attached to every htmx request. */
(function () {
  var TOKEN_KEY = 'nhls_admin_token';

  // document (not body): this file loads in <head> before <body> exists.
  document.addEventListener('htmx:configRequest', function (e) {
    var t = localStorage.getItem(TOKEN_KEY);
    if (t) e.detail.headers['Authorization'] = 'Bearer ' + t;
  });

  document.addEventListener('htmx:responseError', function (e) {
    if (e.detail.xhr && e.detail.xhr.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('nhls_admin_user');
      if (!window.location.pathname.endsWith('/admin/login')) {
        window.location = '/admin/login';
      }
    }
  });

  window.nhlsAdmin = {
    saveSession: function (token, user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('nhls_admin_user', JSON.stringify(user));
    },
    logout: function () {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('nhls_admin_user');
      window.location = '/admin/login';
    },
    user: function () {
      try { return JSON.parse(localStorage.getItem('nhls_admin_user') || 'null'); }
      catch (e) { return null; }
    },
    // /uploads/* now requires auth, but <img>/<embed>/<a> tags cannot send
    // Authorization headers — append the admin JWT as ?token= instead.
    signUploads: function (root) {
      var t = localStorage.getItem(TOKEN_KEY);
      if (!t) return;
      var scope = root && root.querySelectorAll ? root : document;
      var els = scope.querySelectorAll(
        'img[src^="/uploads/"], embed[src^="/uploads/"], a[href^="/uploads/"]');
      Array.prototype.forEach.call(els, function (el) {
        var attr = el.tagName === 'A' ? 'href' : 'src';
        var url = el.getAttribute(attr);
        if (url && url.indexOf('token=') === -1) {
          el.setAttribute(attr,
            url + (url.indexOf('?') === -1 ? '?' : '&') + 'token=' + encodeURIComponent(t));
        }
      });
    },
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.nhlsAdmin.signUploads(document);
  });
  // htmx partials (tables, drawers loaded via htmx) and fetch()-injected
  // drawer HTML both need signing after each swap.
  document.addEventListener('htmx:afterSwap', function (e) {
    window.nhlsAdmin.signUploads(e.target);
  });
  document.addEventListener('htmx:load', function (e) {
    window.nhlsAdmin.signUploads(e.target);
  });
})();
