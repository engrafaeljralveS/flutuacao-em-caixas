# Flutuação em Caixas

Verificação à flutuação e dimensionamento das armaduras de caixas enterradas de concreto armado (NBR 6118).

Programa em um único arquivo HTML (`index.html`), sem dependências: abra no navegador.

## Abas

- **Flutuação**: pesos, subpressão e fator de segurança nas etapas construtiva e de operação; memorial em Word.
- **Armaduras**: esforços nas lajes e paredes (faixa de 1 m), armadura por face, fissuração e cortante sem estribos.

## Testes

```
node testes.js
```

Confere o solver do pórtico contra casos conhecidos e imprime os resultados da caixa padrão.

## Versões

- **v1.0**: reação do terreno uniforme na laje de fundo.
- **v2.0**: laje de fundo e aba sobre molas de Winkler (só compressão), diagramas de momento e cortante, dimensionamento da aba.

Cálculo preliminar: valide coeficientes e hipóteses antes de uso em projeto executivo.
