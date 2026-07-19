<pre># wrangler.toml template

name = "myxl-bypass-gateway"
main = "index.js"
compatibility_date = "2024-01-01"

[vars]
BASE_API_URL = "https://dashboard.xl.co.id"
UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
# Silahkan tambahkan API_KEY di dashboard Cloudflare Environment Anda agar aman tidak bocor di toml!

[[kv_namespaces]]
binding = "TOKENS_KV"
id = "ISI_DENGAN_ID_KV_LU_DISINI"

[triggers]
crons = ["*/5 * * * *"] # Eksekusi cron senty otomatis setiap 5 menit
</pre>