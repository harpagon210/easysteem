/* global EasySteem, config */
/**
 * easysteem testings
 */
var testMethods = [
  'getLoginUrl',
  'setAccessToken',
  // 'me',
  // 'parseReturnedUrl'
  // 'getContent',
  // 'createPost',
  // 'updatePost',
  // 'createComment',
  // 'updateComment',
  // 'deletePostOrComment',
  // 'getFollowers',
  // 'getFollowing'
  // 'calculateVotingPower',
  // 'calculateUserVestingShares',
  'calculateVoteValue',
  'calculateEstimatedAccountValue',
  'calculateBandwidth',
  'calculateReputation'
]

var easysteem = new EasySteem(config.appId, 'easysteem', '1.0')

if (testMethods.indexOf('getLoginUrl') !== -1) {
  console.log(easysteem.getLoginUrl(['vote', 'comment', 'comment_options', 'delete_comment'], config.callbackUrl))
}

if (testMethods.indexOf('parseReturnedUrl') !== -1) {
  console.log(easysteem.parseReturnedUrl('https://my-awesome-website.com/steemconnect/?access_token=THISISASECUREDTOKEN&expires_in=604800&username=' + config.username))
}

if (testMethods.indexOf('setAccessToken') !== -1) {
  easysteem.setAccessToken(config.accessToken)
}

if (testMethods.indexOf('me') !== -1) {
  easysteem.me()
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('upvote') !== -1) {
  easysteem.upvote('harpagon', 'test-permlink', 49.99)
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('downvote') !== -1) {
  easysteem.downvote('harpagon', 'test-permlink', 49.99)
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('getContent') !== -1) {
  easysteem.getContent('harpagon', 'test-title')
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('createPost') !== -1) {
  // create basic post
  easysteem.createPost('test permlink title2', 'body', 'category')
  // create a post with options
  /* easysteem.createPost(
    'title',
    'body',
    'category',
    ['tag1', 'tag2'],
    EasySteem.REWARD_OPTIONS.CENT_PERCENT_SP, // default is set to REWARD_OPTIONS.FIFTY_PERCENT_SP_SBD
    [
      {
        'account': 'harpagon',
        'weight': 50.99 // represents the percentage (50.99% in this case)
      },
      {
        'account': 'account',
        'weight': 0.01 // represents the percentage (0.01% in this case)
      }
    ],
    {
      'format': 'html' // default is set to mardown but you can override
    }) */
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('updatePost') !== -1) {
  // update a post with auto retrieval of the category
  easysteem.updatePost(
    'test-permlink-title',
    'title_update',
    'body_update',
    ['tag1', 'tag2'],
    {
      'format': 'html' // default is set to mardown but you can override
    })
  // update a post when knowing the category
  /* easysteem.updatePost(
    'permlink',
    'title',
    'body',
    ['tag1', 'tag2'],
    {
      'format': 'html' // default is set to mardown but you can override
    },
    'category') */
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('createComment') !== -1) {
  easysteem.createComment('harpagon', 'test-title', '**test comment**')
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('updateComment') !== -1) {
  // update a comment with auto retrieval of the parent post/comment information
  easysteem.updateComment('re-harpagon-test-title-20180312t034345437z', '**test update comment 3**')
  // update a comment when knowing the parent post/comment information
  // easysteem.updateComment('re-harpagon-test-title-20180312t034345437z', '**test update comment 3**', 'harpagon', 'test-title')
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('deletePostOrComment') !== -1) {
  easysteem.deletePostOrComment('re-harpagon-test-title-20180312t202905898z')
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('getFollowers') !== -1) {
  easysteem.getFollowers('harpagon')
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('getFollowing') !== -1) {
  easysteem.getFollowing('harpagon')
    .then(result => console.log(result))
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('calculateVotingPower') !== -1) {
  easysteem.me()
    .then(user => {
      console.log(easysteem.calculateVotingPower(user.account))
      for (let i = 0; i < 5; i++) {
        console.log(easysteem.calculateVotingPower(user.account, i))
      }
    })
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('calculateUserVestingShares') !== -1) {
  easysteem.me()
    .then(user => {
      console.log(easysteem.calculateUserVestingShares(user.account))
    })
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('calculateBandwidth') !== -1) {
  easysteem.me()
    .then(user => {
      easysteem.calculateBandwidth(user.account, 3)
        .then(result => console.log(result))
    })
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('calculateVoteValue') !== -1) {
  easysteem.me()
    .then(user => {
      console.log(easysteem.calculateReputation(user.account))
    })
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('calculateVoteValue') !== -1) {
  easysteem.me()
    .then(user => {
      easysteem.calculateVoteValue(user.account, 100)
        .then(voteValue => console.log(voteValue))
    })
    .catch(error => console.error(error.error, error.error_description))
}

if (testMethods.indexOf('calculateEstimatedAccountValue') !== -1) {
  easysteem.me()
    .then(user => {
      easysteem.calculateEstimatedAccountValue(user.account)
        .then(accountValue => console.log(accountValue))
    })
    .catch(error => console.error(error.error, error.error_description))
}
