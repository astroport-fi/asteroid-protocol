import MarkdownPage from '~/components/MarkdownPage'

const md = `**What is Trollbox?**

A simple chat platform where every post you make is a collectible. That means other people can collect and trade your posts\! 

**Why would I want to collect posts on Trollbox?**

The trolls envision collecting posts as an evolution of the lowly “like” button, which is utilized by legacy, outdated, centralized, siloed, web2 social media platforms. With trollbox, every post you like can enter your collection for a very low fee (starting at less than half a penny\!). If at any point you want to sell your post, you can list it on the secondary markets at [asteroidprotocol.io](https://asteroidprotocol.io/app/inscriptions).

**What’s the point?**

Current social media platforms claim to be “free” to use, but the cost is actually your attention. Web2 sells your attention/brainpower to the highest bidder. And they strive to keep you on the platform with powerful, evolving algorithms that learn from billions of historical interactions. With trollbox’s collect feature, post sales serve as a signal that helps identify the best content on the platform. It’s a model that rewards people who post great content – not advertisers.

**How do I collect posts on Trollbox?**

Click the “collect” button under any post you love\! Each trollpost has a supply of up to 100\. The first person to collect a post pays 0.001 ATOM (less than half a penny or $0.004 at the time of this writing). The fee increases by 0.001 ATOM with every subsequent mint until the 100th mint, which costs 0.1 ATOM ($0.43). After 100 mints have been completed, that post is “minted out,” and the only way to collect it would be to buy it on the secondary markets at [asteroidprotocol.io](https://asteroidprotocol.io/app/inscriptions) (assuming there are people who want to sell it there).

**Do post creators get a royalty on secondary sales?**

Yes\! 90% of all secondary sales goes to the seller of the post, 8% to the original content creator, and 2% is collected on the protocol level and used to buy and burn $ROIDS.

**What do I need to get started?**

Simply connect a web3 wallet (we recommend [Leap](https://www.leapwallet.io/) or [Keplr](https://www.keplr.app/)) that contains some ATOM and start posting. Note that if you don’t have ATOM, there’s a “buy” button inside Leap or Keplr, which you can use.

**How does it work on the backend?**

When you create a post on Trollbox, you’re publishing your data directly onto the Cosmos Hub blockchain as an inscription atop Asteroid Protocol. Other users can then collect a copy of your inscription by “minting” it for a very small fee. The total “supply” or number of times a post can be collected is capped at 100\. If and when all 100 of an individual post are collected, users can buy and sell the inscription on secondary markets at asteroidprotocol.io.

**Can I integrate Trollbox on my website?**

Yes\! All posts can be read in via the [Asteroid API](https://docs.asteroidprotocol.io/developers/asteroid-protocol-api), which means you can filter them to display only the content you’d like to share. To support posting from your third-party website, simply download the [Asteroid SDK](https://docs.asteroidprotocol.io/developers/command-line-tool#installation). Need help? Join us in the [Asteroid Devs chat](https://t.me/+jKqYBOwIj0c5Njgx) on Telegram.

**Is content moderated?**

All trollposts are immutably published to the Cosmos Hub blockchain and can be read-in by third parties including being used for AI model training. Please note that the Trollbox frontend website (which is simply a viewer for content on the Cosmos Hub blockchain) reserves the right to hide or remove any content it deems objectionable.

**Do you support images?**

Not yet 👀

**Why did you build this?**

Web2’s social media model is broken. We envision a platform where users benefit from their usage… not a giant corporation. Trollbox lets you immortalize your words as tokens, collect trending content and trade your thoughts.`

export default function PageFAQ() {
  return <MarkdownPage title="FAQ">{md}</MarkdownPage>
}
