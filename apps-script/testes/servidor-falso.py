import json, hmac, hashlib, base64, uuid, os, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
OUT=sys.argv[1]; os.makedirs(OUT, exist_ok=True)
SEG=b'segredo-mock'; tokens={}
def sig(l):
    m='|'.join(str(x if x is not None else '') for x in [l.get('entrada'),l.get('saida'),l.get('adultos'),l.get('criancas'),l.get('desconto') or 0])
    return base64.urlsafe_b64encode(hmac.new(SEG,m.encode(),hashlib.sha256).digest()).decode().rstrip('=')[:22]
class H(BaseHTTPRequestHandler):
    def _r(self,o):
        b=json.dumps(o).encode(); self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Access-Control-Allow-Origin','*'); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        c=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        a=c.get('acao'); log={k:(v if k not in('contrato','documento','comprovante','arquivo') else {'tipo':v['tipo'],'kb':len(v['base64'])*3//4//1024}) for k,v in c.items()}
        open(OUT+'/log.jsonl','a').write(json.dumps(log,ensure_ascii=False)+'\n')
        if a=='assinarLink':
            return self._r({'ok':True,'c':sig(c['link'])} if c.get('senha')=='senha-teste-123' else {'ok':False,'erro':'Senha da família incorreta.'})
        if a=='conferirLink': return self._r({'ok':True,'valido': bool(c['link'].get('c')) and c['link']['c']==sig(c['link'])})
        if a=='enviarReserva':
            t=str(uuid.uuid4()); tokens[t]=c['codigo']
            for k in ('contrato','documento','comprovante'): open(f"{OUT}/{c['codigo']}-{k}","wb").write(base64.b64decode(c[k]['base64']))
            return self._r({'ok':True,'token':t,'codigo':c['codigo']})
        if a=='enviarAssinado':
            if c.get('token') not in tokens: return self._r({'ok':False,'erro':'Não encontramos esta reserva.'})
            open(f"{OUT}/{tokens[c['token']]}-assinado.pdf","wb").write(base64.b64decode(c['arquivo']['base64'])); return self._r({'ok':True})
        self._r({'ok':False,'erro':'Ação desconhecida.'})
    def log_message(self,*a): pass
HTTPServer(('127.0.0.1',8790),H).serve_forever()
