import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ── Mock global fetch ────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeReq = (overrides: Partial<any> = {}): any => ({
  method: 'GET',
  originalUrl: '/sites/gestion-sites',
  headers: { 'content-type': 'application/json', host: 'localhost' },
  body: null,
  ...overrides,
});

const makeRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const makeUpstreamResponse = (status = 200, body = '{"ok":true}', headers: Record<string, string> = {}) => ({
  status,
  text: jest.fn().mockResolvedValue(body),
  headers: {
    forEach: (cb: (v: string, k: string) => void) => {
      Object.entries({ 'content-type': 'application/json', ...headers }).forEach(([k, v]) => cb(v, k));
    },
  },
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  // ── Health check ────────────────────────────────────────────────────────────
  describe('getHello', () => {
    it('retourne "Hello World!"', () => {
      expect(controller.getHello()).toBe('Hello World!');
    });
  });

  // ── Proxy — succès ──────────────────────────────────────────────────────────
  describe('proxy — succès', () => {
    it('proxifie une requête GET vers sites', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{"data":[]}'));
      const req = makeReq({ originalUrl: '/sites/gestion-sites' });
      const res = makeRes();
      await controller.handleSites(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('{"data":[]}');
    });

    it('proxifie une requête POST vers incidents', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(201, '{"_id":"inc-1"}'));
      const req = makeReq({
        method: 'POST',
        originalUrl: '/incidents/incidents',
        body: { type: 'safety', title: 'Test' },
      });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/incidents'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('proxifie vers projects', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '[]'));
      const req = makeReq({ originalUrl: '/projects/projects' });
      const res = makeRes();
      await controller.handleProjects(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('proxifie vers resources', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{"recommendations":[]}'));
      const req = makeReq({ originalUrl: '/resources/recommendations' });
      const res = makeRes();
      await controller.handleResources(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('proxifie vers planning (prefix planing)', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/planing/task' });
      const res = makeRes();
      await controller.handlePlanning(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('proxifie vers planning (prefix planning)', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/planning/milestone' });
      const res = makeRes();
      await controller.handlePlanning(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('proxifie vers notification', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/notification/send' });
      const res = makeRes();
      await controller.handleNotification(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('proxifie vers videocall (prefix videocall)', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/videocall/room' });
      const res = makeRes();
      await controller.handleVideocall(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('proxifie vers videocall (prefix video-call)', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/video-call/room' });
      const res = makeRes();
      await controller.handleVideocall(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ── Proxy — forwarding headers ──────────────────────────────────────────────
  describe('proxy — forwarding headers', () => {
    it('transmet les headers Authorization', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({
        originalUrl: '/incidents/incidents',
        headers: { authorization: 'Bearer token123', host: 'localhost' },
      });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      const [, options] = mockFetch.mock.calls[0];
      const authHeader = options.headers.get('authorization');
      expect(authHeader).toBe('Bearer token123');
    });

    it('ne transmet pas le header host', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/sites/gestion-sites' });
      const res = makeRes();
      await controller.handleSites(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.get('host')).toBeNull();
    });

    it('ne transmet pas content-length', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({
        originalUrl: '/sites/gestion-sites',
        headers: { 'content-length': '42', host: 'localhost' },
      });
      const res = makeRes();
      await controller.handleSites(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers.get('content-length')).toBeNull();
    });

    it('transmet les headers avec valeurs multiples (array)', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({
        originalUrl: '/sites/gestion-sites',
        headers: { 'x-custom': ['val1', 'val2'], host: 'localhost' },
      });
      const res = makeRes();
      await controller.handleSites(req, res);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('ne transmet pas transfer-encoding dans la réponse', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}', { 'transfer-encoding': 'chunked' }));
      const req = makeReq({ originalUrl: '/sites/gestion-sites' });
      const res = makeRes();
      await controller.handleSites(req, res);
      const calls = res.setHeader.mock.calls.map(([k]: [string]) => k.toLowerCase());
      expect(calls).not.toContain('transfer-encoding');
    });
  });

  // ── Proxy — body handling ───────────────────────────────────────────────────
  describe('proxy — body handling', () => {
    it('sérialise le body JSON pour POST', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(201, '{}'));
      const req = makeReq({
        method: 'POST',
        originalUrl: '/incidents/incidents',
        body: { type: 'safety', title: 'Test' },
      });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBe(JSON.stringify({ type: 'safety', title: 'Test' }));
    });

    it('transmet le body string directement', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({
        method: 'POST',
        originalUrl: '/incidents/incidents',
        body: '{"raw":"string"}',
      });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBe('{"raw":"string"}');
    });

    it('transmet le body Buffer', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({
        method: 'POST',
        originalUrl: '/incidents/incidents',
        body: Buffer.from('binary data'),
      });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBeInstanceOf(Uint8Array);
    });

    it('n\'envoie pas de body pour GET', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ method: 'GET', originalUrl: '/sites/gestion-sites', body: { ignored: true } });
      const res = makeRes();
      await controller.handleSites(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBeUndefined();
    });

    it('n\'envoie pas de body pour HEAD', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, ''));
      const req = makeReq({ method: 'HEAD', originalUrl: '/sites/gestion-sites', body: {} });
      const res = makeRes();
      await controller.handleSites(req, res);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBeUndefined();
    });
  });

  // ── Proxy — erreurs ─────────────────────────────────────────────────────────
  describe('proxy — erreurs', () => {
    it('retourne 502 si fetch échoue (réseau)', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const req = makeReq({ originalUrl: '/sites/gestion-sites' });
      const res = makeRes();
      await controller.handleSites(req, res);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Bad Gateway', detail: 'ECONNREFUSED' }),
      );
    });

    it('retourne 502 si fetch échoue sans message', async () => {
      mockFetch.mockRejectedValue({});
      const req = makeReq({ originalUrl: '/sites/gestion-sites' });
      const res = makeRes();
      await controller.handleSites(req, res);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Bad Gateway', detail: 'upstream unreachable' }),
      );
    });

    it('retourne 404 depuis l\'upstream', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(404, '{"message":"Not Found"}'));
      const req = makeReq({ originalUrl: '/incidents/incidents/nonexistent' });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retourne 500 depuis l\'upstream', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(500, '{"message":"Internal Server Error"}'));
      const req = makeReq({ originalUrl: '/projects/projects' });
      const res = makeRes();
      await controller.handleProjects(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── Proxy — URL building ────────────────────────────────────────────────────
  describe('proxy — construction URL', () => {
    it('construit l\'URL upstream correctement pour sites', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/sites/gestion-sites/123' });
      const res = makeRes();
      await controller.handleSites(req, res);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/gestion-sites/123');
    });

    it('construit l\'URL upstream correctement pour incidents', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/incidents/incidents/by-site/site-1' });
      const res = makeRes();
      await controller.handleIncidents(req, res);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/incidents/by-site/site-1');
    });

    it('gère les query params dans l\'URL', async () => {
      mockFetch.mockResolvedValue(makeUpstreamResponse(200, '{}'));
      const req = makeReq({ originalUrl: '/resources/recommendations?siteId=123&status=pending' });
      const res = makeRes();
      await controller.handleResources(req, res);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('siteId=123');
      expect(url).toContain('status=pending');
    });
  });
});
