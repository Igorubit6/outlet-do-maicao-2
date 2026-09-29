from pathlib import Path
import base64,json,re,zipfile
root=Path(__file__).parent
out=root.parent/'revisao'
out.mkdir(exist_ok=True)
css=(root/'styles.css').read_text()
def embed(match):
 attr,path=match.groups();mime='image/svg+xml' if path.endswith('.svg') else 'image/png' if path.endswith('.png') else 'image/webp' if path.endswith('.webp') else 'image/jpeg'
 return attr+'="data:'+mime+';base64,'+base64.b64encode((root/path).read_bytes()).decode()+'"'
pages={}
for slug in ['index','saldao','comfort','premium']:
 html=(root/(slug+'.html')).read_text()
 html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
 html=re.sub(r'(src|href)="(assets/[^\"]+)"',embed,html)
 (out/(slug+'.html')).write_text(html)
 pages[slug]={'title':re.search(r'<title>(.*?)</title>',html).group(1),'body':re.search(r'<body>(.*)</body>',html,re.S).group(1)}
html=(out/'index.html').read_text()
data=json.dumps(pages,ensure_ascii=False).replace('</','<\\/')
script='''<script>
const pages=PAGE_DATA;
function showPage(){
 const parts=location.hash.slice(1).split('/').filter(Boolean);
 const slug=parts[0]||'index'; const anchor=parts[1]; const page=pages[slug]||pages.index;
 document.title=page.title; document.body.innerHTML=page.body;
 if(anchor){document.getElementById(anchor)?.scrollIntoView();}else{window.scrollTo(0,0);}
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a'); if(!link)return;
 const href=link.getAttribute('href');
 if(!href || /^(https?:|tel:|mailto:|data:)/.test(href))return;
 let slug,anchor;
 if(href.startsWith('#')){slug=location.hash.slice(1).split('/').filter(Boolean)[0]||'index';anchor=href.slice(1);}
 else {const match=href.match(/^(index|saldao|comfort|premium)\\.html(?:#(.*))?$/);if(!match)return;slug=match[1];anchor=match[2];}
 event.preventDefault(); const next='#/'+slug+(anchor?'/'+anchor:'');
 if(location.hash===next)showPage();else location.hash=next;
});
window.addEventListener('hashchange',showPage);showPage();
</script>'''.replace('PAGE_DATA',data)
# Script must stay outside the body replaced by the router.
html=html.replace('</body>', '</body>'+script)
(out/'Outlet-do-Maicao.html').write_text(html)
with zipfile.ZipFile(out.parent/'outlet-do-maicao-revisado.zip','w',zipfile.ZIP_DEFLATED) as z:
 for slug in ['index','saldao','comfort','premium']:z.write(out/(slug+'.html'),slug+'.html')
 z.write(out/'Outlet-do-Maicao.html','Outlet-do-Maicao.html')
print(out/'Outlet-do-Maicao.html')
print('Pages:',list(pages),'arrows:',any(x in html for x in ['↗','→','←']))
