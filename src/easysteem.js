import steem from 'steem'
import sc2 from 'sc2-sdk'
import base58 from 'bs58'
import getSlug from 'speakingurl'
import secureRandom from 'secure-random'
// babel-polyfill required for the async/wait
import 'babel-polyfill' // eslint-disable-line no-unused-vars

module.exports = class EasySteem {
  /**
   * initialize easysteem
   * @constructor
   * @param {String} appId app identifier on your steemconnect dashboard (https://steemconnect.com/dashboard)
   * @param {String} appName app name that will be part of the metadata posted within your app
   * @param {String} appVersion app version that will be part of the metadata posted within your app
   */
  constructor (appId, appName, appVersion) {
    this.steemconnectapi = sc2.Initialize({
      'app': appId
    })

    this.appName = appName
    this.appVersion = appVersion
    this.steem = steem
  }

  /**
   * reward options available on Steem
   */
  static get REWARD_OPTIONS () {
    return {
      'CENT_PERCENT_SP': '100',
      'FIFTY_PERCENT_SP_SBD': '50',
      'NONE': '0'
    }
  }

  /**
   * order options
   */
  static get ORDER_OPTIONS () {
    return {
      'REPUTATION': 'REPUTATION',
      'PAYOUT': 'PAYOUT',
      'PERCENT': 'PERCENT',
      'OLDEST': 'OLDEST',
      'NEWEST': 'NEWEST'
    }
  }

  /**
   * get the url where the user can log into steemconnect
   * @param {Array<String>} scope scope of your application (https://github.com/steemit/steemconnect/wiki/OAuth-2#scopes)
   * @param {String} callbackUrl url where the users will be redirected after interacting with steemconnect
   * @param {String} state data that will be passed to the callbackURL after the user has logged in
   * @returns {String} url to log the user in
   */
  getLoginUrl (scope, callbackUrl, state = null) {
    this.steemconnectapi.setScope(scope)
    this.steemconnectapi.setCallbackURL(callbackUrl)
    return this.steemconnectapi.getLoginURL(state)
  }

  /**
   * log the current user out
   * @returns {Promise<JSON>} return the transaction details
   */
  logout () {
    return this.steemconnectapi.revokeToken()
  }

  /**
   * get the profile of the current user
   * @returns {Promise<JSON>} return the user profile
  */
  me () {
    return this.steemconnectapi.me()
  }

  /**
   * parse a url returned by Steemconnect to get the account, the access token and the expiration time
   * @param {String} url url to parse
   * @example
   * easysteem.parseReturnedUrl('https://my-awesome-website.com/steemconnect/?access_token=THISISASECUREDTOKEN&expires_in=604800&username=harpagon)
   * @returns {JSON} account, accessToken and expTime
   */
  parseReturnedUrl (url) {
    let urlSplitted = url.split('?')[1].split('&')

    let accessToken = urlSplitted.filter((el) => {
      if (el.match('access_token') !== null) {
        return true
      }
    })[0].split('=')[1]

    let expTime = urlSplitted.filter((el) => {
      if (el.match('expires_in') !== null) {
        return true
      }
    })[0].split('=')[1]

    let account = urlSplitted.filter((el) => {
      if (el.match('username') !== null) {
        return true
      }
    })[0].split('=')[1]

    this.setAccessToken(accessToken)
    this.setAccount(account)

    return {
      account,
      accessToken,
      expTime
    }
  }

  /**
   * set the steem account that will be used to perform the actions
   * @param {String} account steem account
   */
  setAccount (account) {
    this.account = account
  }

  /**
   * set the steemconnect oAuth2 access token
   * @param {String} accessToken steemconnect oAuth2 access token
   */
  setAccessToken (accessToken) {
    this.steemconnectapi.setAccessToken(accessToken)
  }

  /**
   * update the current user metadata
   * @param {JSON} metadata
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope custom_json
   */
  updateUserMetadata (metadata) {
    return this.steemconnectapi.updateUserMetadata(metadata)
  }

  /**
   * upvote a post
   * @param {String} postAuthor the username of the author of the post
   * @param {String} postPermlink the permlink of the post
   * @param {Number} weigth the weight of the vote (ex: 0, 1.24, 49.9, 100)
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope vote
   * @example
   * easysteem.upvote('harpagon', 'test-permlink', 49.99)
   *  .then(result => console.log(result))
   *  .catch(error => console.error(error.error, error.error_description))
   */
  upvote (postAuthor, postPermlink, weigth) {
    return this.steemconnectapi.vote(this.account, postAuthor, postPermlink, weigth * 100)
  }

  /**
   * downvote a post
   * @param {String} postAuthor the username of the author of the post
   * @param {String} postPermlink the permlink of the post
   * @param {Number} weigth the weight of the vote (ex: 0, 1.24, 49.9, 100)
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope vote
   * @example
   * easysteem.downvote('harpagon', 'test-permlink', 49.99)
   *  .then(result => console.log(result))
   *  .catch(error => console.error(error.error, error.error_description))
   */
  downvote (postAuthor, postPermlink, weigth) {
    return this.upvote(this.account, postAuthor, postPermlink, weigth * -100)
  }

  /**
   * post a new article
   * @param {String} title title of the post
   * @param {String} body markdown formatted body
   * @param {String} category category of the post
   * @param {Array<String>} tags tags of the post
   * @param {String} rewardOption default is REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD (REWARD_OPTIONS.CENT_PERCENT_SP, REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD or REWARD_OPTIONS.NONE
   * @param {Array<JSON>} beneficiaries array containing the beneficiaries and the weight for their reward ex: [{ 'account': 'harpagon', 'weight': 100 }]
   * @param {JSON} jsonMetadata metadata attached to this post
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope comment, comment_options
   * @example
   * easysteem.createPost(
   *  'title',
   *  'body',
   *  'category',
   *  ['tag1', 'tag2'],
   *  EasySteem.REWARD_OPTIONS.CENT_PERCENT_SP, // default is set to REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD
   *  [
   *    {
   *      'account': 'harpagon',
   *      'weight': 50.99 // represents the percentage (50.99% in this case)
   *    },
   *    {
   *      'account': 'account',
   *      'weight': 0.01 // represents the percentage (0.01% in this case)
   *    }
   *  ],
   *  {
   *    'format': 'html' // default is set to mardown but you can override
   *  })
   *   .then(result => console.log(result))
   *   .catch(error => console.error(error.error, error.error_description))
   */
  createPost (title, body, category, tags = [], rewardOption = EasySteem.REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD, beneficiaries = [], jsonMetadata = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        tags.unshift(category)
        const permlink = await this.createPermlink(title)
        const result = await this.postOperation('', category, permlink, title, body, tags, rewardOption, beneficiaries, jsonMetadata)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * update an existing article
   * @param {String} permlink permlink of the post to update
   * @param {String} title title of the post
   * @param {String} body markdown formatted body
   * @param {Array<String>} tags tags of the post
   * @param {JSON} jsonMetadata metadata attached to this post
   * @param {String} category will be used to update the post, if not provided, it will be retrieved via the Steem API (however the category can't be updated)
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope comment and comment_options
   * @example
   * easysteem.updatePost(
   *  'permlink',
   *  'title',
   *  'body',
   *  ['tag1', 'tag2'],
   *  {
   *    'format': 'html' // default is set to mardown but you can override
   *  },
   *  'category')
   *    .then(result => console.log(result))
   *    .catch(error => console.error(error.error, error.error_description))
   */
  updatePost (permlink, title, body, tags, jsonMetadata, category = null) {
    if (category) {
      return this.postOperation('', category, permlink, title, body, tags, null, [], jsonMetadata)
    } else {
      return new Promise(async (resolve, reject) => {
        try {
          const content = await this.getContent(this.account, permlink)
          if (content.parent_permlink) {
            const result = await this.postOperation('', content.parent_permlink, permlink, title, body, tags, null, [], jsonMetadata)
            resolve(result)
          } else {
            reject(content)
          }
        } catch (error) {
          reject(error)
        }
      })
    }
  }

  /**
   * comment a post or a comment
   * @param {String} parentAuthor author of the post or comment to comment
   * @param {String} parentPermlink permlink of the post or comment to comment
   * @param {String} body markdown formatted body
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope comment and comment_options
   * @example
   * easysteem.createComment('harpagon', 'test-title', '**test comment**')
   *  .then(result => console.log(result))
   *  .catch(error => console.error(error.error, error.error_description))
   */
  createComment (parentAuthor, parentPermlink, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const permlink = await this.createPermlink('', parentAuthor, parentPermlink)
        const result = await this.postOperation(parentAuthor, parentPermlink, permlink, '', body, [], EasySteem.REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * update a comment
   * @param {String} permlink permlink of the post or comment to comment
   * @param {String} body markdiwn formatted body
   * @param {String} parentAuthor parent author of the post or comment to comment (if not provided, this will be retrieved via the Steem API)
   * @param {String} parentPermlink parent permlink of the post or comment to comment (if not provided, this will be retrieved via the Steem API)
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope comment and comment_options
   * @example
   * easysteem.updateComment('re-harpagon-test-title-20180312t034345437z', '**test update comment 3**')
   *  .then(result => console.log(result))
   *  .catch(error => console.error(error.error, error.error_description))
   */
  updateComment (permlink, body, parentAuthor = null, parentPermlink = null) {
    if (parentAuthor && parentPermlink) {
      return this.postOperation(parentAuthor, parentPermlink, permlink, '', body)
    } else {
      return new Promise(async (resolve, reject) => {
        try {
          const content = await this.getContent(this.account, permlink)
          if (content.parent_permlink) {
            const result = await this.postOperation(content.parent_author, content.parent_permlink, permlink, '', body)
            resolve(result)
          } else {
            reject(content)
          }
        } catch (error) {
          reject(error)
        }
      })
    }
  }

  /**
   * delete a post or a comment
   * @param {String} permlink permlink of the post or comment to delete
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope delete_comment
   */
  deletePostOrComment (permlink) {
    const operations = []

    const commentOp = [
      'delete_comment',
      {
        'author': this.account,
        'permlink': permlink
      }
    ]
    operations.push(commentOp)

    return this.steemconnectapi.broadcast(operations)
  }

  /**
   * post on the Steem blockchain
   * @param {String} parentAuthor parent author of the post or comment
   * @param {String} parentPermlink parent permlink of the post or comment
   * @param {String} title title of the post (empty for a comment)
   * @param {String} body markdown formatted body
   * @param {Array<String>} tags tags of the post
   * @param {String} rewardOption REWARD_OPTIONS.CENT_PERCENT_SP, REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD or REWARD_OPTIONS.NONE
   * @param {Array<JSON>} beneficiaries array containing the beneficiaries and the weight for their reward
   * @param {JSON} jsonMetadata metadata attached to this post
   * @returns {Promise<JSON>} return the transaction details
   */
  postOperation (parentAuthor, parentPermlink, permlink, title, body, tags = [], rewardOption = null, beneficiaries = [], jsonMetadata = {}) {
    const operations = []

    jsonMetadata = Object.assign(
      {},
      {
        'tags': tags,
        'app': `${this.appName}/${this.appVersion}`,
        'format': 'markdown'
      },
      jsonMetadata)

    const commentOp = [
      'comment',
      {
        'parent_author': parentAuthor,
        'parent_permlink': parentPermlink,
        'author': this.account,
        'permlink': permlink,
        'title': title,
        'body': body,
        'json_metadata': JSON.stringify(jsonMetadata)
      }
    ]
    operations.push(commentOp)

    const commentOptionsConfig = {
      'author': this.account,
      'permlink': permlink,
      'allow_votes': true,
      'allow_curation_rewards': true,
      'max_accepted_payout': '1000000.000 SBD',
      'percent_steem_dollars': 10000
    }

    if (rewardOption && (rewardOption === EasySteem.REWARD_OPTIONS.NONE)) {
      commentOptionsConfig.max_accepted_payout = '0.000 SBD'
    } else if (rewardOption && (rewardOption === EasySteem.CENT_PERCENT_SP)) {
      commentOptionsConfig.percent_steem_dollars = 0
    }

    if (beneficiaries.length > 0) {
      beneficiaries.sort(function (a, b) {
        let textA = a.account.toUpperCase()
        a.weight *= 100.00
        let textB = b.account.toUpperCase()
        b.weight *= 100.00
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
      })

      commentOptionsConfig.extensions = [
        [
          0,
          {
            // [{ 'account': 'harpagon', 'weight': 1000 }]
            'beneficiaries': beneficiaries
          }
        ]
      ]
    }

    if (rewardOption === EasySteem.REWARD_OPTIONS.NONE || rewardOption === EasySteem.REWARD_OPTIONS.CENT_PERCENT_SP || beneficiaries.length > 0) {
      operations.push(['comment_options', commentOptionsConfig])
    }

    return this.steemconnectapi.broadcast(operations)
  }

  /**
   * reblog a post
   * @param {String} author the author of the post to reblog
   * @param {String} permlink the permlink of the post to reblog
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope custom_json
   */
  reblog (author, permlink) {
    return this.steemconnectapi.reblog(this.account, author, permlink)
  }

  /**
   * follow an author
   * @param {String} author author to follow
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope custom_json
   */
  follow (author) {
    return this.steemconnectapi.follow(this.account, author)
  }

  /**
   * unfollow an author
   * @param {String} author author to unfollow
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope custom_json
   */
  unfollow (author) {
    return this.steemconnectapi.unfollow(this.account, author)
  }

  /**
   * ignore an author
   * @param {String} author author to ignore
   * @returns {Promise<JSON>} return the transaction details
   * @steemconnect_scope custom_json
   * @
   */
  ignore (author) {
    return this.steemconnectapi.ignore(this.account, author)
  }

  /**
   * get the content of a post or comment
   * @param {String} account the account that owns the post or comment
   * @param {String} permlink the permlink of the post or comment
   * @returns {Promise<JSON>} return the content of the post or comment
   */
  getContent (account, permlink) {
    return steem.api.getContentAsync(account, permlink)
  }

  /**
   * retrieve a user account
   * @param {String} username username for which you want to retrieve the account details
   * @returns {JSON} user account details
   */
  getUserAccount (username) {
    return this.getUserAccounts([username])
  }

  /**
   * retrieve a user account
   * @param {Array<String>} usernames usernames for which you want to retrieve the account details
   * @returns {JSON} user account details
   */
  getUserAccounts (usernames) {
    return this.steem.api.getAccountsAsync(usernames)
  }

  /**
   * get the followers of a user
   * @param {String} username the username for which you want to retrieve the followers
   * @returns {Array<JSON>} an array containing the followers
   */
  getFollowers (username) {
    return new Promise(async resolve => {
      let retVal = []
      let startFollower = ''
      const followCount = await this.steem.api.getFollowCountAsync(username)
      const count = followCount.follower_count
      for (let i = 0; i < count; i += 1000) {
        let temp = await this.steem.api.getFollowersAsync(username, startFollower, 'blog', 1000)
        Array.prototype.push.apply(retVal, temp)
        startFollower = retVal[retVal.length - 1].follower
      }
      resolve(retVal)
    })
  }

  /**
   * get the following of a user
   * @param {String} username the username for which you want to retrieve the following
   * @returns {Array<JSON>} an array containing the following
   */
  getFollowing (username) {
    return new Promise(async resolve => {
      let retVal = []
      let startFollower = ''
      const followCount = await this.steem.api.getFollowCountAsync(username)
      const count = followCount.following_count
      for (let i = 0; i < count; i += 1000) {
        let temp = await this.steem.api.getFollowingAsync(username, startFollower, 'blog', 100)
        Array.prototype.push.apply(retVal, temp)
        startFollower = retVal[retVal.length - 1].follower
      }
      resolve(retVal)
    })
  }

  /**
   * get the active votes of a post or comment
   * @param {String} author author of the post or comment
   * @param {String} permlink permlink of the post or comment
   */
  getActiveVotes (author, permlink) {
    return this.steem.api.getActiveVotesAsync(author, permlink)
  }

  /**
   * get the replies to a post or comment
   * @param {String} author author of the post or comment
   * @param {String} permlink permlink of the post or comment
   */
  getContentReplies (author, permlink) {
    return this.steem.api.getContentRepliesAsync(author, permlink)
  }

  /**
   * parse a payout amount from AMOUNT SDB to $AMOUNT
   * @param {String} amount string representing the SBD amount
   * @returns {String} parsed payout amount
   * @link https://github.com/steemit/steemit.com/blob/47fd0e0846bd8c7c941ee4f95d5f971d3dc3981d/app/utils/ParsersAndFormatters.js
   */
  parsePayoutAmount (amount) {
    return parseFloat(String(amount).replace(/\s[A-Z]*$/, ''))
  }

  /**
   * Calculates Payout Details
   * @param {JSON} post post JSON
   * @returns {JSON} JSON representing the payout details
   * @link https://github.com/steemit/steemit.com/blob/47fd0e0846bd8c7c941ee4f95d5f971d3dc3981d/app/components/elements/Voting.jsx
   */
  calculatePayout (post) {
    const payoutDetails = {}
    const activeVotes = post.active_votes
    const parentAuthor = post.parent_author
    const cashoutTime = post.cashout_time

    const maxPayout = this.parsePayoutAmount(post.max_accepted_payout)
    const pendingPayout = this.parsePayoutAmount(post.pending_payout_value)
    const promoted = this.parsePayoutAmount(post.promoted)
    const totalAuthorPayout = this.parsePayoutAmount(post.total_payout_value)
    const totalCuratorPayout = this.parsePayoutAmount(post.curator_payout_value)
    const isComment = parentAuthor !== ''

    let payout = pendingPayout + totalAuthorPayout + totalCuratorPayout
    if (payout < 0.0) payout = 0.0
    if (payout > maxPayout) payout = maxPayout
    payoutDetails.payoutLimitHit = payout >= maxPayout

    // There is an 'active cashout' if: (a) there is a pending payout, OR (b)
    // there is a valid cashout_time AND it's NOT a comment with 0 votes.
    const cashoutActive =
    pendingPayout > 0 ||
      (cashoutTime.indexOf('1969') !== 0 && !(isComment && activeVotes.length === 0))

    if (cashoutActive) {
      payoutDetails.potentialPayout = pendingPayout
    }

    if (promoted > 0) {
      payoutDetails.promotionCost = promoted
    }

    if (cashoutActive) {
      // Append '.000Z' to make it ISO format (YYYY-MM-DDTHH:mm:ss.sssZ).
      payoutDetails.cashoutInTime = cashoutTime + '.000Z'
    }

    if (maxPayout === 0) {
      payoutDetails.isPayoutDeclined = true
    } else if (maxPayout < 1000000) {
      payoutDetails.maxAcceptedPayout = maxPayout
    }

    if (totalAuthorPayout > 0) {
      payoutDetails.pastPayouts = totalAuthorPayout + totalCuratorPayout
      payoutDetails.authorPayouts = totalAuthorPayout
      payoutDetails.curatorPayouts = totalCuratorPayout
    }

    return payoutDetails
  }

  /**
   * check and modifiy a permlink if necessary to fit the Steem blockchain requirements
   * @param {String} permlink permlink to check
   * @returns permlink checked and potentially modified
   */
  checkPermLinkLength (permlink) {
    if (permlink.length > 255) {
      // STEEMIT_MAX_PERMLINK_LENGTH
      permlink = permlink.substring(permlink.length - 255, permlink.length)
    }
    // only letters numbers and dashes shall survive
    permlink = permlink.toLowerCase().replace(/[^a-z0-9-]+/g, '')
    return permlink
  }

  slug (text) {
    return getSlug(text.replace(/[<>]/g, ''), { truncate: 128 })
  }

  /**
   * create a permlink
   * @param {String} title title of the post (empty for a comment)
   * @param {String} parentAuthor parent author of the comment
   * @param {String} parentPermlink parent permlink of the comment
   * @returns {String} permlink
   * @link: https://github.com/steemit/steemit.com/blob/ded8ecfcc9caf2d73b6ef12dbd0191bd9dbf990b/app/redux/TransactionSaga.js
   */
  createPermlink (title, parentAuthor = null, parentPermlink = null) {
    let permlink
    if (title && title.trim() !== '') {
      let s = this.slug(title)
      if (s === '') {
        s = base58.encode(secureRandom.randomBuffer(4))
      }

      return this.steem.api.getContentAsync(this.account, s)
        .then(content => {
          let prefix
          if (content.body !== '') {
            // make sure slug is unique
            prefix = `${base58.encode(secureRandom.randomBuffer(4))}-`
          } else {
            prefix = ''
          }
          permlink = prefix + s
          return this.checkPermLinkLength(permlink)
        })
        .catch(err => {
          console.warn('Error while getting content', err)
          return permlink
        })
    }
    // comments: re-parentauthor-parentpermlink-time
    const timeStr = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '')
    parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '')
    permlink = `re-${parentAuthor}-${parentPermlink}-${timeStr}`
    return Promise.resolve(this.checkPermLinkLength(permlink))
  }

  /**
   * Refresh the global propertis linked to Steem and the rates
   */
  refreshSteemProperties () {
    return Promise.all([
      this.steem.api.getRewardFundAsync('post'),
      this.steem.api.getDynamicGlobalPropertiesAsync(),
      this.getCryptoCurrencyPrice('STEEM'),
      this.getCryptoCurrencyPrice('SBD')
    ])
      .then((results) => {
        this.steemProperties = {}
        // set the reward balance and the recent claims
        this.steemProperties.rewardBalance = this.parsePayoutAmount(results[0].reward_balance)
        this.steemProperties.recentClaims = this.parsePayoutAmount(results[0].recent_claims)

        // set other data
        this.steemProperties.totalVestingFund = this.parsePayoutAmount(results[1].total_vesting_fund_steem)
        this.steemProperties.totalVestingShares = this.parsePayoutAmount(results[1].total_vesting_shares)
        this.steemProperties.maxVirtualBandwidth = parseInt(results[1].max_virtual_bandwidth, 10)

        // set the rates
        this.steemProperties.steemRate = results[2]
        this.steemProperties.sbdRate = results[3]
      })
  }

  /**
   * calculate the Steem value of a user vote
   * @param {JSON} user a user object
   * @param {Number} voteWeight the weight of the vote to calculate
   * @param {Number} numberDecimals default 2, number of decimals to return
   * @param {Boolean} refreshSteemProperties default true, refresh the Steem properties (Steem rate, etc...)
   * @returns {Number} the value of the vote in Steem
   */
  calculateVoteValue (user, voteWeight = 100.00, numberDecimals = 2, refreshSteemProperties = true) {
    return new Promise(async resolve => {
      if (!this.steemProperties || refreshSteemProperties) {
        await this.refreshSteemProperties()
      }

      const votingPower = this.calculateVotingPower(user, numberDecimals) * 100
      voteWeight = voteWeight * 100
      const vestingShares = parseInt(this.calculateUserVestingShares(user) * 1e6, 10)
      const power = votingPower * voteWeight / 10000 / 50
      const rshares = power * vestingShares / 10000
      resolve((rshares / this.steemProperties.recentClaims * this.steemProperties.rewardBalance * this.steemProperties.steemRate).toFixed(numberDecimals))
    })
  }

  /**
   * calculate a user's vesting shares
   * @param {JSON} user a user object
   * @returns {Number} the user's vesting shares
   */
  calculateUserVestingShares (user) {
    const vestingShares = parseFloat(this.parsePayoutAmount(user.vesting_shares))
    const receivedVestingShares = parseFloat(this.parsePayoutAmount(user.received_vesting_shares))
    const delegatedVestingShares = parseFloat(this.parsePayoutAmount(user.delegated_vesting_shares))
    return vestingShares + receivedVestingShares - delegatedVestingShares
  }

  /**
   * calculate the total amount of Steem Power delegated
   * @param {JSON} user
   * @param {Number} totalVestingShares
   * @param {Number} totalVestingFundSteem
   */
  calculateTotalDelegatedSP (user, totalVestingShares, totalVestingFundSteem) {
    const receivedSP = parseFloat(
      this.vestToSteem(user.received_vesting_shares, totalVestingShares, totalVestingFundSteem)
    )
    const delegatedSP = parseFloat(
      this.vestToSteem(user.delegated_vesting_shares, totalVestingShares, totalVestingFundSteem)
    )
    return receivedSP - delegatedSP
  }

  /**
   * calculate the voting power of a user
   * @param {JSON} user a user object
   * @param {Number} numberDecimals number of decimals to return, default 2
   * @return {Number} a number representing the voting power of the user
   */
  calculateVotingPower (user, numberDecimals = 2) {
    const secondsago = (new Date() - new Date(user.last_vote_time + 'Z')) / 1000
    const vpow = user.voting_power + (10000 * secondsago / 432000)
    return Math.min(vpow / 100, 100).toFixed(numberDecimals)
  }

  /**
   * calculate the bandwidth information of a user
   * @param {JSON} user a user object
   * @param {Number} numberDecimals number of decimals to return, default 2
   * @param {Boolean} refreshSteemProperties default true, refresh the Steem properties (Steem rate, etc...)
   * @returns {JSON} json with the bandwidth information (used, allocated in percents and bytes)
   */
  calculateBandwidth (user, numberDecimals = 2, refreshSteemProperties = true) {
    return new Promise(async resolve => {
      if (!this.steemProperties || refreshSteemProperties) {
        await this.refreshSteemProperties()
      }

      const STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS = 60 * 60 * 24 * 7
      let vestingShares = parseFloat(this.parsePayoutAmount(user.vesting_shares))
      let receivedVestingShares = parseFloat(this.parsePayoutAmount(user.received_vesting_shares))
      let averageBandwidth = parseInt(user.average_bandwidth, 10)

      let deltaTime = (new Date() - new Date(user.last_bandwidth_update + 'Z')) / 1000

      let bandwidthAllocated = (this.steemProperties.maxVirtualBandwidth * (vestingShares + receivedVestingShares) / this.steemProperties.totalVestingShares)
      bandwidthAllocated = Math.round(bandwidthAllocated / 1000000)

      let newBandwidth = 0
      if (deltaTime < STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS) {
        newBandwidth = (((STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS - deltaTime) * averageBandwidth) / STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS)
      }
      newBandwidth = Math.round(newBandwidth / 1000000)

      resolve({
        'percents': {
          'remaining': (100 - (100 * newBandwidth / bandwidthAllocated)).toFixed(numberDecimals),
          'used': (100 * newBandwidth / bandwidthAllocated).toFixed(numberDecimals)
        },
        'bytes': {
          'remaining': this.bytesToSize(bandwidthAllocated - newBandwidth, numberDecimals),
          'used': this.bytesToSize(newBandwidth, numberDecimals),
          'allocated': this.bytesToSize(bandwidthAllocated, numberDecimals)
        }
      })
    })
  }

  /**
   * calculate the reputation in a more readable way
   * @param {JSON} user a user object
   * @param {*} numberDecimals number of decimals to return, default 2
   */
  calculateReputation (rawReputation, numberDecimals = 2) {
    const isNegative = (rawReputation < 0)
    let reputation = Math.log10(Math.abs(rawReputation))

    reputation = Math.max(reputation - 9, 0)
    reputation *= isNegative ? -9 : 9
    reputation += 25

    return reputation.toFixed(numberDecimals)
  }

  /**
   * calculate an estimation of an account value
   * @param {JSON} user a user object
   * @param {Number} numberDecimals default 2, number of decimals to return
   * @param {Boolean} refreshSteemProperties default true, refresh the Steem properties (Steem rate, etc...)
   */
  calculateEstimatedAccountValue (
    user,
    numberDecimals = 2,
    refreshSteemProperties = true
  ) {
    return new Promise(async resolve => {
      if (!this.steemProperties || refreshSteemProperties) {
        await this.refreshSteemProperties()
      }

      const steemPower = this.vestToSteem(
        this.parsePayoutAmount(user.vesting_shares),
        this.steemProperties.totalVestingShares,
        this.steemProperties.totalVestingFund
      )

      resolve(
        (parseFloat(this.steemProperties.steemRate) * (parseFloat(user.balance) + parseFloat(steemPower)) +
         parseFloat(user.sbd_balance) * parseFloat(this.steemProperties.sbdRate)).toFixed(numberDecimals)
      )
    })
  }

  /**
   * convert an amount of vestings into an amount of Steem
   * @param {Number} vestingShares
   * @param {Number} totalVestingShares
   * @param {Number} totalVestingFundSteem
   */
  vestToSteem (vestingShares, totalVestingShares, totalVestingFundSteem) {
    return (
      parseFloat(totalVestingFundSteem) *
      (parseFloat(vestingShares) / parseFloat(totalVestingShares))
    )
  }

  /**
   * get the USD price of a crypto currency
   * @param {String} currency a cryptocompare compatible crypto currency code
   * @returns {Number} the USD price of the crypto currency
   */
  getCryptoCurrencyPrice (currency) {
    return new Promise(async resolve => {
      fetch(`https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=USD`) // eslint-disable-line no-undef
        .then(async res => {
          const json = await res.json()
          resolve(json.USD)
        })
    })
  }

  /**
   * orders the votes
   * @param {Array<JSON>} votes array containing the votes
   * @param {String} orderBy default EasySteem.ORDER_OPTIONS.PAYOUT but REPUTATION, PERCENT, PAYOUT available
   * @returns {Array<JSON>} the input array ordered
   */
  orderVotes (votes, orderBy = EasySteem.ORDER_OPTIONS.PAYOUT) {
    return new Promise(async resolve => {
      if (!this.steemProperties && orderBy === EasySteem.ORDER_OPTIONS.PAYOUT) {
        await this.refreshSteemProperties()
      }

      if (votes.length > 1) {
        votes.sort((a, b) => {
          switch (orderBy) {
            case EasySteem.ORDER_OPTIONS.PAYOUT:
              let votePayoutA = this.sharesToSteem(a.rshares)
              a.votePayout = votePayoutA.toFixed(3)
              let votePayoutB = this.sharesToSteem(b.rshares)
              b.votePayout = votePayoutB.toFixed(3)
              return votePayoutA > votePayoutB ? -1 : votePayoutA < votePayoutB ? 1 : 0

            case EasySteem.ORDER_OPTIONS.REPUTATION:
              let voteReputationA = this.calculateReputation(a.reputation)
              a.voteReputation = voteReputationA
              let voteReputationB = this.calculateReputation(b.reputation)
              b.voteReputation = voteReputationB
              return voteReputationA > voteReputationB ? -1 : voteReputationA < voteReputationB ? 1 : 0

            case EasySteem.ORDER_OPTIONS.PERCENT:
              let votePercentA = a.percent
              let votePercentB = b.percent
              return votePercentA > votePercentB ? -1 : votePercentA < votePercentB ? 1 : 0
          }
        })
      } else if (votes.length > 0) {
        switch (orderBy) {
          case EasySteem.ORDER_OPTIONS.PAYOUT:
            votes[0].votePayout = this.sharesToSteem(votes[0].rshares).toFixed(3)
            break
          case EasySteem.ORDER_OPTIONS.REPUTATION:
            votes[0].voteReputation = this.calculateReputation(votes[0].reputation)
            break
          default:
        }
      }

      resolve(votes)
    })
  }

  /**
   * orders the comments
   * @param {Array<JSON>} votes array containing the comments
   * @param {String} orderBy default EasySteem.ORDER_OPTIONS.PAYOUT but OLDEST, NEWEST, REPUTATION, PAYOUT available
   * @returns {Array<JSON>} the input array ordered
   */
  orderComments (comments, orderBy = EasySteem.ORDER_OPTIONS.PAYOUT) {
    return new Promise(async resolve => {
      if (!this.steemProperties && orderBy === EasySteem.ORDER_OPTIONS.PAYOUT) {
        await this.refreshSteemProperties()
      }

      if (comments.length > 1) {
        comments.sort((a, b) => {
          switch (orderBy) {
            case EasySteem.ORDER_OPTIONS.NEWEST:
              a = new Date(a.created)
              b = new Date(b.created)
              return a > b ? -1 : a < b ? 1 : 0

            case EasySteem.ORDER_OPTIONS.OLDEST:
              a = new Date(a.created)
              b = new Date(b.created)
              return a < b ? -1 : a > b ? 1 : 0

            case EasySteem.ORDER_OPTIONS.PAYOUT:
              a = this.parsePayoutAmount(a.pending_payout_value) === 0 ? this.parsePayoutAmount(a.total_payout_value) + this.parsePayoutAmount(a.curator_payout_value) : this.parsePayoutAmount(a.pending_payout_value)
              b = this.parsePayoutAmount(b.pending_payout_value) === 0 ? this.parsePayoutAmount(b.total_payout_value) + this.parsePayoutAmount(b.curator_payout_value) : this.parsePayoutAmount(b.pending_payout_value)
              return a > b ? -1 : a < b ? 1 : 0

            case EasySteem.ORDER_OPTIONS.REPUTATION:
              let commentReputationA = this.calculateReputation(a.author_reputation)
              a.commentReputation = commentReputationA
              let commentReputationB = this.calculateReputation(b.author_reputation)
              b.commentReputation = commentReputationB
              return commentReputationA > commentReputationB ? -1 : commentReputationA < commentReputationB ? 1 : 0
          }
        })
      } else if (comments.length > 0) {
        switch (orderBy) {
          case EasySteem.ORDER_OPTIONS.REPUTATION:
            comments[0].commentReputation = this.calculateReputation(comments[0].author_reputation)
            break
          default:
        }
      }

      resolve(comments)
    })
  }

  /**
   * converts a number of shares into a number of Steem
   * @param {Number} rshares number of shares
   * @returns the shares converted into a Steem value
   */
  sharesToSteem (shares) {
    return shares * this.steemProperties.rewardBalance / this.steemProperties.recentClaims * this.steemProperties.steemRate
  }

  /**
   * convert a number of bytes into a readable size (1B, 1KB, 1MB, ...)
   * @param {Number} bytes the bytes to convert
   * @param {Number} numberDecimals default 2, number of decimals to return
   * @return {String} formated string representing the size
   */
  bytesToSize (bytes, numberDecimals) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    if (i === 0) return `${bytes} ${sizes[i]})`
    return `${(bytes / (1024 ** i)).toFixed(numberDecimals)} ${sizes[i]}`
  }
}
