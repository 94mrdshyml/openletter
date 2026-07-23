export const publication = {
	name: 'The Meridian',
	tagline: 'Where borders meet policy.',
	description:
		'Where borders meet policy. Analysis at the intersection of power, territory, and consequence.',
	slug: 'themeridian.pub',
	subscriberCount: 847,
	analytics: {
		newThisWeek: 23,
		avgOpenRate: 68,
		postsPublished: 12,
		avgClickRate: 14
	}
};

export type Post = {
	slug: string;
	title: string;
	date: string;
	excerpt: string;
	body: string[];
	status: 'draft' | 'published';
	openRate?: number;
	editedRelative?: string;
};

export const posts: Post[] = [
	{
		slug: 'quiet-realignment-central-asian-gas-routes',
		title: 'The Quiet Realignment of Central Asian Gas Routes',
		date: '2026-07-18',
		excerpt:
			"Turkmenistan's new pipeline agreement with Azerbaijan bypasses Russia entirely — a shift three decades in the making that redraws the energy map of Central Asia.",
		status: 'published',
		openRate: 74,
		body: [
			'Turkmenistan signed a framework agreement with Azerbaijan last week for the construction of a subsea pipeline across the Caspian — a corridor that would carry natural gas westward to Europe without touching Russian territory. The deal, thirty years in the making, was announced without fanfare at a bilateral meeting in Ashgabat. No press conference, no signing ceremony. The understated delivery belied the strategic significance.',
			'For decades, Central Asian gas had only one route to market: north, through the Soviet-era pipeline network that Russia inherited and controlled. Turkmenistan, sitting atop the world’s fourth-largest proven reserves, was effectively a captive supplier. Moscow set the transit fees, dictated the volumes, and used the leverage to keep Ashgabat economically dependent and politically compliant.',
			"Three developments converged to change the calculus. The EU's post-2022 pivot away from Russian energy created genuine demand for alternative supply. Azerbaijan's Shah Deniz field began its natural decline, creating capacity in the Southern Gas Corridor. And China's economic slowdown reduced its appetite for the eastward volumes flowing through the Central Asia–China pipeline, freeing Turkmenistan to look west again.",
			'The Trans-Caspian Pipeline has been discussed since the mid-1990s. Russia and Iran consistently opposed it — Russia because it threatened its transit monopoly, Iran because unresolved maritime boundaries in the Caspian gave it a legal pretext to block construction. The 2018 Convention on the Legal Status of the Caspian Sea removed the Iranian veto by establishing that subsea pipelines required consent only from the states whose seabed they crossed. But political will was still absent until the energy map of Europe was redrawn by war.',
			'The implications extend well beyond energy. A functioning Trans-Caspian corridor would reorient Central Asia’s economic geography, creating a genuine alternative to both Russian and Chinese infrastructure dependency. For the EU, it diversifies supply at a moment when diversification has become doctrine. For Turkmenistan, it is the first credible path to economic sovereignty in a generation. The pipeline that seemed permanently hypothetical is now, quietly, becoming real.'
		]
	},
	{
		slug: 'arctic-shipping-lane-nato-northern-flank',
		title: "What the New Arctic Shipping Lane Means for NATO's Northern Flank",
		date: '2026-07-11',
		excerpt:
			"Last month's first commercial transit through the Transpolar Sea Route didn't make front pages. It should have.",
		status: 'published',
		openRate: 68,
		body: [
			"Last month's first commercial transit through the Transpolar Sea Route didn't make front pages. It should have.",
			"A container vessel crossed the high Arctic north of Russia's exclusive economic zone in international waters, avoiding both the Northern Sea Route's Russian tolls and the Northwest Passage's Canadian jurisdiction claims — a preview of a shipping lane that will only open wider as sea ice continues to retreat.",
			"For NATO's northern members, the strategic calculus is shifting faster than defense planning cycles can accommodate. A commercially viable transpolar route changes naval presence requirements, undersea cable routing, and the entire logic of Arctic basing decisions."
		]
	},
	{
		slug: 'taiwan-strait-traffic-data',
		title: 'Taiwan Strait Traffic Data Tells a Different Story',
		date: '2026-07-04',
		excerpt:
			'Satellite tracking of commercial shipping through the Taiwan Strait reveals a pattern that contradicts the prevailing narrative about regional escalation.',
		status: 'published',
		openRate: 67,
		body: [
			'Satellite tracking of commercial shipping through the Taiwan Strait reveals a pattern that contradicts the prevailing narrative about regional escalation.',
			'Commercial transit volumes have held essentially flat over the past eighteen months, even as naval patrol frequency has increased on both sides. The market, it seems, is pricing this differently than the headlines suggest.',
			'That gap between commercial risk assessment and political rhetoric is itself the story worth watching.'
		]
	},
	{
		slug: 'eu-critical-minerals-kazakhstan',
		title: "The EU's Critical Minerals Bet on Kazakhstan",
		date: '2026-06-27',
		excerpt:
			'Brussels signed its third rare-earth supply agreement this quarter, all pointing toward a single corridor through Central Asia.',
		status: 'published',
		openRate: 64,
		body: [
			'Brussels signed its third rare-earth supply agreement this quarter, all pointing toward a single corridor through Central Asia.',
			'The pattern is deliberate: diversify away from Chinese processing capacity by building an entirely parallel supply chain, with Kazakhstan as the anchor point for extraction and a first stage of processing.',
			"Whether this works depends on infrastructure that doesn't fully exist yet — and on Kazakhstan's own balancing act between Brussels, Moscow, and Beijing."
		]
	},
	{
		slug: 'india-port-diplomacy',
		title: "Why India's Port Diplomacy Is Outpacing China's",
		date: '2026-06-20',
		excerpt:
			"In the last eighteen months, India has secured operating agreements at seven ports across the Indian Ocean rim — each one a quiet counterweight to Beijing's Belt and Road.",
		status: 'published',
		openRate: 63,
		body: [
			"In the last eighteen months, India has secured operating agreements at seven ports across the Indian Ocean rim — each one a quiet counterweight to Beijing's Belt and Road.",
			'Unlike China’s debt-financed infrastructure model, India’s approach favors operating concessions over ownership — a lighter footprint that has proven easier for host governments to accept politically.',
			'The result is a string of pearls of its own, assembled with far less controversy than the strategy it was designed to counter.'
		]
	}
];

export const draftPosts: Post[] = [
	{
		slug: 'south-china-sea-insurance-war',
		title: "The South China Sea's Quiet Insurance War",
		date: '',
		excerpt: '',
		status: 'draft',
		editedRelative: '2 hours ago',
		body: [
			"The biggest risk to freedom of navigation in the South China Sea isn't a military blockade. It's the price of marine insurance.",
			'Over the past fourteen months, underwriters at Lloyd’s and their counterparts in Singapore have quietly reclassified three shipping zones adjacent to the Spratly Islands. The new designations — "listed areas" in insurance terminology — don’t prohibit transit. They increase the cost of it. A vessel entering a listed area pays a war-risk premium on top of its standard hull coverage, typically an additional 0.1 to 0.5 percent of the ship’s insured value per voyage.',
			"For a container ship valued at $150 million, that's an additional $150,000 to $750,000 per passage. Multiplied across the roughly 100,000 commercial transits through the South China Sea each year, the aggregate cost reshapes trade routes more effectively than any naval deployment could.",
			'Continue writing...'
		]
	},
	{
		slug: 'greenland-question',
		title: 'Notes on the Greenland Question',
		date: '',
		excerpt: '',
		status: 'draft',
		editedRelative: 'yesterday',
		body: []
	}
];

export const postPerformance = [
	{ title: posts[0].title, date: 'Jul 18', opened: 612, openRate: 74, clicks: 89 },
	{ title: posts[1].title, date: 'Jul 11', opened: 558, openRate: 68, clicks: 72 },
	{ title: posts[2].title, date: 'Jul 4', opened: 541, openRate: 67, clicks: 65 },
	{ title: posts[3].title, date: 'Jun 27', opened: 502, openRate: 64, clicks: 58 },
	{ title: posts[4].title, date: 'Jun 20', opened: 488, openRate: 63, clicks: 51 }
];

export const subscriberGrowth = [
	12, 15, 14, 22, 28, 35, 38, 42, 48, 55, 60, 58, 65, 70, 72, 78, 82, 80, 85, 90, 88, 92, 95, 100
];
