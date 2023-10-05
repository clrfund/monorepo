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


14. $\alpha = \frac{(B - \sum_{p}(\sum_{i} C_{i})) * P} {v\sum_{p}(\sum_{i}\sqrt{c_{i}})^2  - \sum_{p}(\sum_{i} C_{i})}$

where P = alpha precision

## Allocated Amount

1. $A = \frac{\alpha}{P} (\sum_{i}\sqrt{C})^2 + (1-\frac{\alpha}{P})\sum_{i} C$


> You can render LaTeX mathematical expressions using [KaTeX](https://khan.github.io/KaTeX/)
> You can use the online app: https://stackedit.io/app#

> You can find more information about **LaTeX** mathematical expressions [here](http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference).



