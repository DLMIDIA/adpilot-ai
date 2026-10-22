#!/bin/bash
# AdPilot AI - Script de Inicialização Rápida
# Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🚀 Iniciando AdPilot AI — Copiloto de Tráfego Pago & Meta"
echo "Desenvolvido por Daniel Júnior Barbosa da Silva (DL MIDIA)"
echo "=========================================================="

./node_modules/.bin/electron .
