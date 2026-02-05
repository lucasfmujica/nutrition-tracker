#!/bin/bash
# Script para verificar que los archivos SEO están deployados correctamente

echo "🔍 Verificando archivos SEO en www.lukenfit.com..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar URL
check_url() {
    local url=$1
    local name=$2

    echo -n "Verificando $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

# Verificar archivos
echo "──────────────────────────────────────────────────"
check_url "https://www.lukenfit.com/robots.txt" "robots.txt"
check_url "https://www.lukenfit.com/sitemap.xml" "sitemap.xml"
check_url "https://www.lukenfit.com/llms.txt" "llms.txt"
check_url "https://www.lukenfit.com/manifest.json" "manifest.json"
check_url "https://www.lukenfit.com/favicon.svg" "favicon.svg"
echo "──────────────────────────────────────────────────"

# Verificar contenido de robots.txt
echo ""
echo "📄 Contenido de robots.txt:"
echo "──────────────────────────────────────────────────"
curl -s "https://www.lukenfit.com/robots.txt"
echo ""
echo "──────────────────────────────────────────────────"

# Verificar sitemap.xml
echo ""
echo "📄 Contenido de sitemap.xml (primeras líneas):"
echo "──────────────────────────────────────────────────"
curl -s "https://www.lukenfit.com/sitemap.xml" | head -n 15
echo "..."
echo "──────────────────────────────────────────────────"

# Verificar meta tags OpenGraph
echo ""
echo "🏷️  Meta tags OpenGraph en index.html:"
echo "──────────────────────────────────────────────────"
curl -s "https://www.lukenfit.com/" | grep -E '(og:|twitter:)' | head -n 10
echo "──────────────────────────────────────────────────"

echo ""
echo "✨ Próximos pasos:"
echo "1. Esperar 24-48h para que Google reintente leer el sitemap"
echo "2. O forzar re-crawl en Google Search Console:"
echo "   https://search.google.com/search-console"
echo "3. Verificar preview social en: https://www.opengraph.xyz/"
echo ""
echo -e "${YELLOW}⚠️  Recuerda crear og-image.jpg (ver OG_IMAGE_INSTRUCTIONS.md)${NC}"
