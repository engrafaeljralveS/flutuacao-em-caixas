# Flutuação em Caixas

Verificação à flutuação e dimensionamento das armaduras de caixas enterradas de concreto armado (NBR 6118).

Programa em um único arquivo HTML (`index.html`), sem dependências: abra no navegador.

## Abas

- **Flutuação**: pesos, subpressão e fator de segurança nas etapas construtiva e de operação; memorial em Word.
- **Esforços**: análise por elementos finitos de casca (caixa 3D com molas de Winkler): carregamentos, mapas de esforços, diagramas nas faixas centrais e envoltórias de dimensionamento.
- **Armaduras**: dimensionamento por face (flexão e flexo-tração), armadura mínima e máxima, bitola e espaçamento, fissuração e cortante sem estribos (NBR 6118).

## Testes

```
node testes.js
```

Confere o motor de elementos finitos contra a placa engastada (Timoshenko) e o pórtico plano, o equilíbrio e a convergência da malha, e imprime o dimensionamento da caixa padrão.

## Versões

- **v1.0**: reação do terreno uniforme na laje de fundo.
- **v2.0**: laje de fundo e aba sobre molas de Winkler (só compressão), diagramas de momento e cortante, dimensionamento da aba.
- **v2.1**: aba Esforços, com os diagramas das ações (solo, água, subpressão, sobrecarga, cargas permanentes e reação do terreno).
- **v3.0**: esforços por elementos finitos de casca (MITC4 + membrana), em ¼ da caixa com simetria, molas de Winkler só de compressão, Wood-Armer e flexo-tração; abas Esforços (análise) e Armaduras (dimensionamento).

Cálculo preliminar: valide coeficientes e hipóteses antes de uso em projeto executivo.
