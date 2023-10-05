## QF Alpha

B is the total budget which is the sum of all project allocations. Project allocation formula is the first formula from page 17 of https://arxiv.org/pdf/1809.06421.pdf.

1. $B = \sum_{p}( \alpha (\sum_{i}\sqrt{C})^2 + (1-\alpha)\sum_{i} C )$

2. $B = \sum_{p}( \alpha (\sum_{i}\sqrt{C})^2 + (\sum_{i} C) -(\alpha\sum_{i} C ))$

3. $B = \sum_{p}( \alpha (\sum_{i}\sqrt{C})^2) + \sum_{p}(\sum_{i} C) - \sum_{p}(\alpha\sum_{i} C )$

4. $B - \sum_{p}(\sum_{i} C_{i}) = \sum_{p}( \alpha (\sum_{i}\sqrt{C_{i}})^2)  - \sum_{p}(\alpha\sum_{i} C_{i} )$

5. $B - \sum_{p}(\sum_{i} C_{i}) = \sum_{p}( \alpha (\sum_{i}\sqrt{C_{i}})^2)  - \sum_{p}(\alpha\sum_{i} C_{i} )$

6. $B - \sum_{p}(\sum_{i} C_{i}) = \alpha\sum_{p}(\sum_{i}\sqrt{C_{i}})^2  - \alpha\sum_{p}(\sum_{i} C_{i} )$

7. $B - \sum_{p}(\sum_{i} C_{i}) = \alpha(\sum_{p}(\sum_{i}\sqrt{C_{i}})^2  - \sum_{p}(\sum_{i} C_{i}))$

8. $\alpha = \frac{B - \sum_{p}(\sum_{i} C_{i})} {\sum_{p}(\sum_{i}\sqrt{C_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$

9. $\alpha = \frac{B - \sum_{p}(\sum_{i} C_{i})} {\sum_{p}(\sum_{i}\sqrt{vc_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$

where v = voiceCreditFactor, c = voice credit

10. $\alpha = \frac{B - \sum_{p}(\sum_{i} C_{i})} {\sum_{p}(\sum_{i}\sqrt{v}\sqrt{c_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$

11. $\alpha = \frac{B - \sum_{p}(\sum_{i} C_{i})} {\sum_{p}(\sqrt{v}\sum_{i}\sqrt{c_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$

12. $\alpha = \frac{B - \sum_{p}(\sum_{i} C_{i})} {\sum_{p}v(\sum_{i}\sqrt{c_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$

13. $\alpha = \frac{B - \sum_{p}(\sum_{i} C_{i})} {v\sum_{p}(\sum_{i}\sqrt{c_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$


## Allocated amount

$A = \alpha (\sum_{i}\sqrt{C})^2 + (1-\alpha)\sum_{i} C$

## Overflow edge case

The quadratic funding formula has 2 parts, the quadratic component and the linear component. The quadratic component is the most aggressive funding scheme, while the linear component simply pays out the contributions received directly.

The problem occurs when even the most aggressive funding scheme (i.e. fully quadratic, alpha = 1), is insufficient to consume the entire budget.

In order to consume the entire budget, the equation requires alpha to fall out of the valid range for weights ( the closed interval [0, 1] ).

When alpha is greater than 1, negative intermediate values occur in the  allocated amount equation, which causes overflow, which in v0.8.0 and above of Solidity cause a revert (while in prior version, overflow was simple ignored). 

Below is the test case that demonstrates alpha = 6.25.

$P_{1} = [ 0.4, 0.4 ]$
$P_{2} = [ 0.4, 0.4 ]$
$M = 10$
$C = 0.4 * 4 = 1.6$
$B = M + C = 11.6$

Where this indicates 2 projects ($P_{1}$ and $P_{2}$), each with 2 contributions each of 0.4. M is the matching pool, C is the total contributions, B is the total budget.

$B = 2 * (\alpha (\sqrt{C} + \sqrt{C})^2 + (1-\alpha)(C + C) )$
$B = 2 * (\alpha (2\sqrt{C})^2 + (1-\alpha)(2C) )$
$B = 2 * (\alpha 4C + 2C -\alpha2C)$
$B = 2 * (\alpha 2C + 2C)$
$B = \alpha 4C + 4C$
$\alpha = \frac{B - 4C}{4C}$
$\alpha = \frac{11.6 - 1.6}{1.6}$
$\alpha = \frac{10}{1.6}$
$\alpha = 6.25$


Note, if we change the test case to have 5 contributions per project, the alpha = 0.625, which falls in the valid range.


> You can render LaTeX mathematical expressions using [KaTeX](https://khan.github.io/KaTeX/)

> You can use the online app: https://stackedit.io/app#

> You can find more information about **LaTeX** mathematical expressions [here](http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference).



