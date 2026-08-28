(function () {
  'use strict';

  const config = window.FUTMAC_SUPABASE_CONFIG || {};
  const ARTICLE_FIELDS = 'id,slug,content_type,category_slug,title,excerpt,body,author_name,author_slug,image_url,image_alt,status,read_time,published_at,created_at,updated_at';
  let editedAuthorOriginalId = '';
  const MANAGED_ARTICLE_FIELDS = ARTICLE_FIELDS + ',created_by';
  let clientPromise = null;

  function enabled() {
    return config.enabled === true && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '') && typeof config.publishableKey === 'string' && config.publishableKey.length > 20;
  }

  function loadLibrary() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-futmac-supabase]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.supabase); }, { once: true });
        existing.addEventListener('error', function () { reject(new Error('Supabase bağlantı kütüphanesi yüklenemedi.')); }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = new URL('assets/vendor/supabase-2.112.3.min.js', document.baseURI).href;
      script.async = true;
      script.dataset.futmacSupabase = 'true';
      script.onload = function () { resolve(window.supabase); };
      script.onerror = function () { reject(new Error('Supabase bağlantı kütüphanesi yüklenemedi.')); };
      document.head.appendChild(script);
    });
  }

  async function getClient() {
    if (!enabled()) throw new Error('Supabase bağlantısı henüz yapılandırılmadı.');
    if (!clientPromise) {
      clientPromise = loadLibrary().then(function (library) {
        return library.createClient(config.url, config.publishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      });
    }
    return clientPromise;
  }

  function rowToArticle(row) {
    const published = row.published_at ? new Date(row.published_at) : new Date(row.updated_at || row.created_at);
    const scheduled = row.status === 'published' && published.getTime() > Date.now();
    return {
      id: row.id,
      slug: row.slug,
      type: row.content_type,
      category: row.category_slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.body,
      date: published.toISOString().slice(0, 10),
      displayDate: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(published),
      time: published.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      author: row.author_name || 'FUTMAC Servisi',
      authorId: row.author_slug || undefined,
      image: row.image_url || 'assets/images/futbol-manset.svg',
      imageAlt: row.image_alt || '',
      status: scheduled ? 'scheduled' : row.status,
      readTime: row.read_time || '3 dk',
      ownerId: row.created_by || null,
      url: 'haber-onizleme.html?id=' + encodeURIComponent(row.id),
      remote: true
    };
  }

  function articleToRow(article) {
    const publishedAt = new Date(article.date + 'T' + article.time + ':00');
    const row = {
      slug: article.slug,
      content_type: article.type,
      category_slug: article.category,
      title: article.title,
      excerpt: article.excerpt,
      body: article.content,
      author_name: article.author,
      author_slug: article.authorId || null,
      image_url: article.image,
      status: article.status === 'scheduled' ? 'published' : article.status,
      read_time: article.readTime,
      published_at: ['published', 'scheduled', 'archived'].includes(article.status) ? publishedAt.toISOString() : null
    };
    if (config.leagueManagementEnabled === true) row.image_alt = article.imageAlt || '';
    if (article.id && !String(article.id).startsWith('local-')) row.id = article.id;
    return row;
  }

  async function signIn(email, password) {
    const client = await getClient();
    const result = await client.auth.signInWithPassword({ email: email, password: password });
    if (result.error) throw result.error;
    const profile = await getProfile(result.data.user.id);
    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      await client.auth.signOut();
      throw new Error('Bu hesabın yönetim paneline erişim yetkisi yok.');
    }
    return { session: result.data.session, profile: profile };
  }

  async function getSession() {
    const client = await getClient();
    const result = await client.auth.getUser();
    if (result.error) throw result.error;
    if (!result.data.user) return null;
    const sessionResult = await client.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    if (!sessionResult.data.session) return null;
    const profile = await getProfile(result.data.user.id);
    if (!profile || !['editor', 'admin'].includes(profile.role)) return null;
    return { session: sessionResult.data.session, profile: profile };
  }

  async function onAuthStateChange(callback) {
    const client = await getClient();
    const result = client.auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
    return function () { result.data.subscription.unsubscribe(); };
  }

  async function getProfile(userId) {
    const client = await getClient();
    const result = await client.from('profiles').select('id,display_name,role').eq('id', userId).single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function signOut() {
    const client = await getClient();
    const result = await client.auth.signOut();
    if (result.error) throw result.error;
  }

  async function requestPasswordReset(email) {
    const client = await getClient();
    const redirectTo = new URL('sifre-yenile.html', window.location.href).href;
    const result = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
    if (result.error) throw result.error;
  }

  async function updatePassword(password) {
    const client = await getClient();
    const result = await client.auth.updateUser({ password: password });
    if (result.error) throw result.error;
    return result.data.user;
  }

  async function listArticles(options) {
    const client = await getClient();
    const requestedLimit = Number(options && options.limit);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : (options && options.publishedOnly ? 200 : 500), 1), 500);
    const fields = options && options.publishedOnly ? ARTICLE_FIELDS : MANAGED_ARTICLE_FIELDS;
    let query = client.from('articles').select(fields).order('published_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(limit);
    if (options && options.publishedOnly) query = query.eq('status', 'published').lte('published_at', new Date().toISOString());
    const result = await query;
    if (result.error) throw result.error;
    return result.data.map(rowToArticle);
  }

  async function listCategories() {
    const client = await getClient();
    if (config.leagueManagementEnabled !== true) {
      const fallback = await client.from('categories').select('slug,name,description,is_active').order('name').limit(200);
      if (fallback.error) throw fallback.error;
      return fallback.data.map(function (row) { return { id:row.slug, name:row.name, description:row.description, active:row.is_active, showInMenu:false, system:true, sortOrder:0, advanced:false }; });
    }
    const result = await client.from('categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true }).limit(200);
    if (result.error) {
      if (result.error.code === '42703') {
        const fallback = await client.from('categories').select('slug,name,description,is_active').order('name').limit(200);
        if (fallback.error) throw fallback.error;
        return fallback.data.map(function (row) { return { id:row.slug, name:row.name, description:row.description, active:row.is_active, showInMenu:false, system:true, sortOrder:0, advanced:false }; });
      }
      throw result.error;
    }
    return result.data.map(function (row) { return { id:row.slug, name:row.name, description:row.description, active:row.is_active, showInMenu:row.show_in_menu, system:row.is_system, sortOrder:row.sort_order, advanced:true }; });
  }

  function optionalRows(result) {
    if (!result.error) return result.data;
    const message = String(result.error.message || '');
    if (['PGRST205', '42P01'].includes(result.error.code) || message.includes('schema cache') || message.includes('does not exist')) return null;
    throw result.error;
  }

  async function listAuthors() {
    const client = await getClient();
    const rows = optionalRows(await client.from('authors').select('*').order('sort_order').order('name').limit(200));
    if (rows === null) return null;
    return rows.map(function (row) {
      const profiles = { furkan:'yazar-furkan.html', eray:'yazar-eray.html', berkay:'yazar-berkay.html' };
      return { id: row.slug, name: row.name, role: row.role, bio: row.bio, image: row.image_url, active: row.is_active, sortOrder: row.sort_order, profile: profiles[row.slug] || 'yazarlar.html' };
    });
  }

  async function getSiteSettings() {
    const client = await getClient();
    const result = await client.from('site_settings').select('settings,updated_at').eq('id', true).maybeSingle();
    if (result.error) {
      const missing = optionalRows(result);
      if (missing === null) return null;
    }
    return result.data ? Object.assign({}, result.data.settings || {}, { updatedAt:result.data.updated_at }) : {};
  }

  async function saveSiteSettings(settings) {
    const client = await getClient();
    const result = await client.from('site_settings').upsert({ id:true, settings:settings }, { onConflict:'id' }).select('settings,updated_at').single();
    if (result.error) throw result.error;
    return Object.assign({}, result.data.settings || {}, { updatedAt:result.data.updated_at });
  }

  async function listTeams() {
    const client = await getClient();
    const rows = optionalRows(await client.from('league_teams').select('*').order('sort_order').order('name').limit(200));
    if (rows === null) return null;
    return rows.map(function (row) { return { id: row.id, name: row.name, manager: row.manager, shortName: row.short_name || '', logo: row.logo_url || 'assets/images/logo/emac-turka-transparent.png', active: row.is_active, sortOrder: row.sort_order }; });
  }

  async function listStandings() {
    const client = await getClient();
    const results = await Promise.all([
      client.from('standings').select('team_id,played,won,drawn,lost,fantasy_points,league_points,movement,form,updated_at').limit(200),
      client.from('league_teams').select('id,name,manager,sort_order,is_active').eq('is_active', true).order('sort_order').order('name').limit(200)
    ]);
    const rows = optionalRows(results[0]), teamRows = optionalRows(results[1]);
    if (rows === null || teamRows === null) return null;
    const byTeam = new Map(rows.map(function (row) { return [row.team_id, row]; }));
    const merged = teamRows.map(function (team) {
      const saved = byTeam.get(team.id) || {};
      return { team_id:team.id, played:saved.played || 0, won:saved.won || 0, drawn:saved.drawn || 0, lost:saved.lost || 0, fantasy_points:saved.fantasy_points || 0, league_points:saved.league_points || 0, movement:saved.movement || 'same', form:saved.form || [], updated_at:saved.updated_at || null, team:team };
    });
    merged.sort(function (a, b) { return b.league_points - a.league_points || b.fantasy_points - a.fantasy_points || (a.team.sort_order || 0) - (b.team.sort_order || 0); });
    return merged.map(function (row, index) { return { rank: index + 1, teamId: row.team_id, team: row.team.name, manager: row.team.manager, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, fantasy: row.fantasy_points, points: row.league_points, change: row.movement, form: row.form || [], updatedAt: row.updated_at }; });
  }

  async function listFixtures() {
    const client = await getClient();
    const rows = optionalRows(await client.from('fixtures').select('id,week,kickoff_at,status,home_score,away_score,home:league_teams!fixtures_home_team_id_fkey(id,name),away:league_teams!fixtures_away_team_id_fkey(id,name)').order('week').order('kickoff_at').limit(1000));
    if (rows === null) return null;
    const weeks = {};
    rows.forEach(function (row) {
      const kickoff = new Date(row.kickoff_at);
      if (!weeks[row.week]) weeks[row.week] = [];
      weeks[row.week].push({ id: row.id, week: row.week, homeTeamId: row.home.id, awayTeamId: row.away.id, home: row.home.name, away: row.away.name, kickoffAt: row.kickoff_at, date: new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'long', year:'numeric' }).format(kickoff), time: kickoff.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }), status: row.status, homeScore: row.home_score, awayScore: row.away_score });
    });
    return weeks;
  }

  async function saveFixture(fixture) {
    const client = await getClient();
    const row = { week: fixture.week, home_team_id: fixture.homeTeamId, away_team_id: fixture.awayTeamId, kickoff_at: fixture.kickoffAt, status: fixture.status, home_score: fixture.status === 'scheduled' ? null : fixture.homeScore, away_score: fixture.status === 'scheduled' ? null : fixture.awayScore };
    if (fixture.id) row.id = fixture.id;
    const result = row.id ? await client.from('fixtures').update(row).eq('id', row.id).select().single() : await client.from('fixtures').insert(row).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function deleteFixture(id) {
    const client = await getClient(); const result = await client.from('fixtures').delete().eq('id', id); if (result.error) throw result.error;
  }

  async function saveStanding(item) {
    const client = await getClient();
    const row = { team_id:item.teamId, played:item.played, won:item.won, drawn:item.drawn, lost:item.lost, fantasy_points:item.fantasy, league_points:item.points, movement:item.change, form:item.form };
    const result = await client.from('standings').upsert(row, { onConflict:'team_id' }).select().single(); if (result.error) throw result.error; return result.data;
  }

  async function saveAuthor(author) {
    const client = await getClient();
    const row = { slug:author.id, name:author.name, role:author.role, bio:author.bio, image_url:author.image, is_active:author.active, sort_order:author.sortOrder };
    const originalId = author.originalId || editedAuthorOriginalId || author.id;
    if (originalId === author.id) {
      const result = await client.from('authors').upsert(row, { onConflict:'slug' }).select().single(); if (result.error) throw result.error; editedAuthorOriginalId = ''; return result.data;
    }
    const changed = await client.from('authors').update(row).eq('slug', originalId).select().single();
    if (changed.error) throw changed.error;
    const linked = await client.from('articles').update({ author_slug:author.id, author_name:author.name }).eq('author_slug', originalId);
    if (linked.error) {
      await client.from('authors').update({ slug:originalId }).eq('slug', author.id);
      throw linked.error;
    }
    editedAuthorOriginalId = '';
    return changed.data;
  }

  async function deleteAuthor(id) {
    const client = await getClient();
    const linked = await client.from('articles').select('id', { count:'exact', head:true }).eq('author_slug', id);
    if (linked.error) throw linked.error;
    if ((linked.count || 0) > 0) throw new Error('author_has_articles');
    const result = await client.from('authors').delete().eq('slug', id);
    if (result.error) throw result.error;
  }

  function setAuthorOriginalId(id) { editedAuthorOriginalId = id || ''; }

  async function saveTeam(team) {
    const client = await getClient();
    const row = { name:team.name, manager:team.manager, short_name:team.shortName || null, logo_url:team.logo, is_active:team.active, sort_order:team.sortOrder };
    if (team.id) row.id = team.id;
    const result = row.id ? await client.from('league_teams').update(row).eq('id', row.id).select().single() : await client.from('league_teams').insert(row).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function deleteTeam(id) {
    const client = await getClient();
    const result = await client.from('league_teams').delete().eq('id', id);
    if (result.error) throw result.error;
  }

  async function saveCategory(category) {
    const client = await getClient();
    const row = { slug:category.id, name:category.name, description:category.description, is_active:category.active, show_in_menu:category.showInMenu, sort_order:category.sortOrder };
    if (category.system !== undefined) row.is_system = category.system;
    const result = await client.from('categories').upsert(row, { onConflict:'slug' }).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function deleteCategory(id) {
    const client = await getClient();
    const result = await client.from('categories').delete().eq('slug', id);
    if (result.error) throw result.error;
  }

  async function listProfiles() {
    const client = await getClient();
    const result = await client.from('profiles').select('id,display_name,role,updated_at').order('display_name').limit(200);
    if (result.error) throw result.error;
    return result.data.map(function (row) { return { id:row.id, name:row.display_name, role:row.role, updatedAt:row.updated_at }; });
  }

  async function saveProfile(profile) {
    const client = await getClient();
    const result = await client.from('profiles').update({ display_name:profile.name, role:profile.role }).eq('id', profile.id).select('id,display_name,role,updated_at').single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function listAuditLogs() {
    const client = await getClient();
    const rows = optionalRows(await client.from('audit_log').select('id,actor_name,actor_role,action,table_name,record_id,created_at').order('created_at', { ascending:false }).limit(200));
    if (rows === null) return null;
    return rows.map(function (row) { return { id:row.id, actor:row.actor_name || 'Sistem', role:row.actor_role || '', action:row.action, table:row.table_name, recordId:row.record_id || '—', createdAt:row.created_at }; });
  }

  async function healthCheck() {
    const client = await getClient();
    const userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data.user) throw new Error('Oturum doğrulanamadı.');
    const userId = userResult.data.user.id;
    const profile = await getProfile(userId);
    const database = await client.from('categories').select('slug').limit(1);
    if (database.error) throw database.error;
    const editorPermission = await client.rpc('is_editor');
    if (editorPermission.error) throw editorPermission.error;
    const adminPermission = await client.rpc('is_admin');
    if (adminPermission.error) throw adminPermission.error;
    const isAdmin = profile.role === 'admin';
    if (editorPermission.data !== true || Boolean(adminPermission.data) !== isAdmin) throw new Error('Sunucu rolü ile profil rolü uyuşmuyor.');
    const visibleProfiles = await client.from('profiles').select('id').limit(200);
    if (visibleProfiles.error) throw visibleProfiles.error;
    const profileRows = visibleProfiles.data || [];
    const profileScopeValid = isAdmin
      ? profileRows.some(function (row) { return row.id === userId; })
      : profileRows.length === 1 && profileRows[0].id === userId;
    if (!profileScopeValid) throw new Error('Profil görünürlüğü güvenlik sınırıyla uyuşmuyor.');
    const auditResult = await client.from('audit_log').select('id').limit(1);
    if (auditResult.error) throw auditResult.error;
    if (!isAdmin && (auditResult.data || []).length) throw new Error('Editör hesabı işlem geçmişini görmemelidir.');
    const ownershipResult = await client.from('articles').select('created_by').limit(1);
    if (ownershipResult.error) throw new Error('Haber sahipliği politikası hazır değil. 004_article_ownership.sql migration dosyasını çalıştırın.');
    const authSettingsResponse = await fetch(config.url + '/auth/v1/settings', { headers:{ apikey:config.publishableKey } });
    if (!authSettingsResponse.ok) throw new Error('Auth güvenlik ayarları okunamadı.');
    const authSettings = await authSettingsResponse.json();
    return {
      auth:true,
      database:true,
      audit:isAdmin ? 'ready' : 'protected',
      profile:profile,
      permissions:{ editor:true, admin:isAdmin, profileScope:isAdmin ? 'all' : 'self', articleScope:isAdmin ? 'all' : 'own' },
      registration:{ signupDisabled:authSettings.disable_signup === true, anonymousDisabled:!(authSettings.external && authSettings.external.anonymous_users === true) },
      library:'2.112.3-local',
      mediaBucket:Boolean(config.mediaBucket)
    };
  }

  async function saveArticle(article) {
    const client = await getClient();
    const row = articleToRow(article);
    const result = row.id
      ? await client.from('articles').update(row).eq('id', row.id).select(MANAGED_ARTICLE_FIELDS).single()
      : await client.from('articles').insert(row).select(MANAGED_ARTICLE_FIELDS).single();
    if (result.error) throw result.error;
    return rowToArticle(result.data);
  }

  async function deleteArticle(id) {
    const client = await getClient();
    const result = await client.from('articles').delete().eq('id', id);
    if (result.error) throw result.error;
  }

  async function uploadImage(file, folder) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!file || !allowed.includes(file.type)) throw new Error('Yalnızca JPG, PNG veya WebP görsel yüklenebilir.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Görsel 5 MB sınırını aşıyor.');
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
    const webp = String.fromCharCode.apply(null, bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode.apply(null, bytes.slice(8, 12)) === 'WEBP';
    if ((file.type === 'image/jpeg' && !jpeg) || (file.type === 'image/png' && !png) || (file.type === 'image/webp' && !webp)) throw new Error('Dosya uzantısı ile gerçek görsel biçimi uyuşmuyor.');
    const client = await getClient();
    const userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data.user) throw new Error('Görsel yüklemek için yeniden giriş yapın.');
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const safeFolder = folder === 'authors' ? 'authors' : folder === 'teams' ? 'teams' : 'articles';
    const path = safeFolder + '/' + userResult.data.user.id + '/' + crypto.randomUUID() + '.' + extension;
    const upload = await client.storage.from(config.mediaBucket || 'futmac-media').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (upload.error) throw upload.error;
    const publicUrl = client.storage.from(config.mediaBucket || 'futmac-media').getPublicUrl(path);
    return publicUrl.data.publicUrl;
  }

  window.FUTMAC_SUPABASE = Object.freeze({
    enabled: enabled(), leagueManagementEnabled: config.leagueManagementEnabled === true,
    getClient: getClient, getSession: getSession, onAuthStateChange: onAuthStateChange, signIn: signIn,
    signOut: signOut, requestPasswordReset: requestPasswordReset, updatePassword: updatePassword,
    listArticles: listArticles, saveArticle: saveArticle, deleteArticle: deleteArticle, listCategories: listCategories,
    listAuthors: listAuthors, listTeams: listTeams, listStandings: listStandings, listFixtures: listFixtures,
    getSiteSettings: getSiteSettings, saveSiteSettings: saveSiteSettings,
    saveFixture: saveFixture, deleteFixture: deleteFixture, saveStanding: saveStanding, saveAuthor: saveAuthor, deleteAuthor: deleteAuthor, setAuthorOriginalId: setAuthorOriginalId,
    saveTeam: saveTeam, deleteTeam: deleteTeam, saveCategory: saveCategory, deleteCategory: deleteCategory,
    listProfiles: listProfiles, saveProfile: saveProfile, listAuditLogs: listAuditLogs, healthCheck: healthCheck,
    uploadImage: uploadImage
  });
}());
