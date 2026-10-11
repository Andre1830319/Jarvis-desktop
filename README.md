# JARVIS Desktop (Electron)

Casca desktop para o seu `jarvis.py`. O Python continua sendo o cérebro (microfone, voz, agente);
o Electron só mostra a orb numa janela própria e cuida de bandeja, tela cheia e instalador.

## Instalação (uma vez)
1. Instale o Node.js LTS (nodejs.org).
2. Coloque a pasta `jarvis-desktop` DENTRO da pasta `jarvis-main` (ao lado do `jarvis.py`).
3. Substitua o `jarvis.py` pelo atualizado (ou aplique `jarvis_window.patch`).
4. Na pasta `jarvis-desktop`: `npm install`

## Abrir sem digitar `npm start`
Depois do `npm install`, dê duplo clique em **`Criar atalho na area de trabalho.vbs`** (uma vez). Aparece o atalho **JARVIS** na Área de Trabalho:
é só clicar nele (abre sem terminal; erros vão para `jarvis_desktop_start.txt`). Para abrir junto com o Windows, use o menu da bandeja → "Iniciar com o Windows".

## Abrir sozinho ao ligar o PC
Duplo clique em **`Iniciar com o Windows.vbs`** (uma vez): cria o atalho na pasta Inicializar do Windows. Para desfazer: `Remover do inicio do Windows.vbs`.
Para abrir direto na bandeja, sem janela (voz e transmissão já funcionando), edite esse arquivo e troque `modo = ""` por `modo = " hidden"`.
- Se você já colocou um atalho do `Jarvis.vbs` na pasta Inicializar (README antigo), **remova-o**: o app inicia o `jarvis.py` sozinho, e os dois juntos podem rodar dois microfones.
- Não ligue também o item "Iniciar com o Windows" da bandeja: seria a mesma coisa duas vezes (o app evita abrir duplicado, mas não precisa dos dois).

## Transmissão de tela para o celular
Continua igual: peça **pela orb do celular** ("quero ver o que está acontecendo nos meus dois monitores"). Precisa de `JARVIS_HUD_HOST=0.0.0.0` no `.env` (o seu já tem) e do Tailscale ligado.
- O painel do PC não tem botão para iniciar a transmissão de propósito: iniciar pelo PC mandaria a tela para o próprio PC e o celular ficaria bloqueado ("já estou transmitindo para outro dispositivo"). "Parar transmissão" funciona do PC.
- "Tela cheia" por voz é ignorado enquanto há transmissão, para não afetar o painel do celular.
- "Sair" na bandeja encerra o `jarvis.py` que o app iniciou, e com ele o acesso do celular. O X da janela não: só vai para a bandeja.
- Com o PC suspenso/hibernando o celular não alcança o Jarvis.

## Uso
- `npm start` abre o JARVIS. Se o `jarvis.py` ainda não estiver rodando, o app inicia sozinho (sem janela de terminal).
  Se já estiver (ex.: pelo `Jarvis.vbs`), o app só se conecta — não abre um segundo, que duplicaria o microfone.
- **F11**: tela cheia (Esc sai). **Ctrl+Alt+H**: esconde/mostra. **Ctrl+Alt+J** (atalho do Windows): abre o JARVIS se não estiver aberto, ou traz a janela para frente. **X da janela**: vai para a bandeja, não encerra.
- **Voz** (precisa do app aberto): "Jarvis, fique em segundo plano" · "Jarvis, tela cheia" · "Jarvis, sair da tela cheia" · "Jarvis, mostra a janela".
- Bandeja (ícone perto do relógio): mostrar, tela cheia, esconder, iniciar com o Windows, trocar pasta, **Sair** (encerra tudo, inclusive o Python que o app iniciou).

## Instalador .exe
`npm run dist` → gera `dist/JARVIS Setup 1.0.0.exe` (instala o app e cria atalho na área de trabalho e no Menu Iniciar).
O instalador leva só a casca. Na primeira abertura ele procura o `jarvis.py` e, se não achar, pede a pasta do projeto
(o Python e o `requirements.txt` continuam sendo instalados por você, como hoje).

## Limitações (leia antes de confiar)
- **Não testado no Windows.** Foi só checada a sintaxe (`node --check`, `py_compile`) e a lógica dos comandos de voz com frases de exemplo.
- Segundo plano = a janela some; quem ouve "jarvis" é o Python pelo microfone do PC, e ele não depende da janela.
  Já o **botão de microfone da orb** usa reconhecimento de voz do navegador, que no Electron provavelmente NÃO funciona
  (precisa de chaves do Google). Pelo PC, use a palavra de ativação; digitar na orb funciona normalmente.
- Comandos de janela por voz só valem enquanto o app desktop estiver conectado; sem ele a frase vai para o assistente como antes.
- "Sair" encerra o Python só se foi o app que o iniciou.
- O painel (Command Center) só aparece em janelas largas (≥ 1100 px). No celular continua a orb simples. Abra `?classic=1` para ver a orb simples no PC.
- O painel mostra só dados reais do seu Jarvis. Itens do mockup que o seu projeto não tem (memória, provedores de IA, agentes "Coding/Research", calendário) ficaram de fora em vez de ser inventados.
- CPU/RAM/disco só aparecem no app desktop (vêm do próprio Windows); no navegador ficam "—".
