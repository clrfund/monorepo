<template>
	<div class="about">
		<h1 class="content-heading">{{ $t('quadratic_funding.heading.h1') }}</h1>

		<h2>{{ $t('quadratic_funding.heading.h2') }}</h2>
		<p>
			{{ $t('quadratic_funding.heading.p1') }}
		</p>
		<ol>
			<li>{{ $t('quadratic_funding.heading.li1') }}</li>
			<li>{{ $t('quadratic_funding.heading.li2') }}</li>
		</ol>
		<p>
			{{ $t('quadratic_funding.heading.p2') }}
			<b>{{ $t('quadratic_funding.heading.sqrt') }}</b>
			{{ $t('quadratic_funding.heading.more') }}
		</p>
		<h2>{{ $t('quadratic_funding.problems.h2') }}</h2>
		<p>
			{{ $t('quadratic_funding.problems.p1') }}
		</p>
		<h3>{{ $t('quadratic_funding.problems.h3') }}</h3>
		<p>
			{{ $t('quadratic_funding.problems.p2') }}
		</p>
		<p>
			{{ $t('quadratic_funding.problems.p3') }}
		</p>
		<p>
			{{ $t('quadratic_funding.problems.p4') }}
		</p>
		<h3>{{ $t('quadratic_funding.private.h3') }}</h3>
		<p>
			{{ $t('quadratic_funding.private.p1') }}
		</p>
		<p>
			{{ $t('quadratic_funding.private.p2') }}
		</p>
		<p>
			{{ $t('quadratic_funding.private.p3') }}
		</p>
		<h3>{{ $t('quadratic_funding.democratic.h3') }}</h3>
		<p>
			{{ $t('quadratic_funding.democratic.p1') }}
		</p>
		<p>
			{{ $t('quadratic_funding.democratic.p2') }}
		</p>
		<p>
			{{ $t('quadratic_funding.democratic.p3') }}
		</p>
		<h2>{{ $t('quadratic_funding.balance.h3') }}</h2>
		<p>
			{{ $t('quadratic_funding.balance.p1') }}
		</p>
		<p>
			{{ $t('quadratic_funding.balance.p2') }}
		</p>
		<ul>
			<li>
				{{ $t('quadratic_funding.balance.li1') }}
			</li>
			<li>
				{{ $t('quadratic_funding.balance.li2') }}
			</li>
		</ul>
		<p>
			{{ $t('quadratic_funding.balance.p3') }}
		</p>
		<ul>
			<li>{{ $t('quadratic_funding.balance.li3') }}</li>
			<li>
				{{ $t('quadratic_funding.balance.li4') }}
			</li>
		</ul>
		<p>
			{{ $t('quadratic_funding.balance.p4') }}
		</p>
		<h2>{{ $t('quadratic_funding.resources.h2') }}</h2>
		<ul>
			<li>
				<links to="https://vitalik.ca/general/2019/12/07/quadratic.html">{{
					$t('quadratic_funding.resources.li1')
				}}</links>
			</li>
			<li>
				<links to="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3243656">{{
					$t('quadratic_funding.resources.li2')
				}}</links>
			</li>
			<li>
				<links to="https://www.radicalxchange.org/concepts/quadratic-voting/">{{
					$t('quadratic_funding.resources.li3')
				}}</links>
			</li>
			<li>
				<links
					to="https://wtfisqf.com/?grant=10&grant=5,5&grant=2,2,2,2,2&grant=1,1,1,1,1,1,1,1,1,1&match=1000"
					>{{ $t('quadratic_funding.resources.li4') }}</links
				>
			</li>
		</ul>
	</div>
</template>
