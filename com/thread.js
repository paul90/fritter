/* globals app */

const yo = require('yo-yo')
const renderAvatar = require('./avatar')
const renderFollowButton = require('./follow-btn')
const renderPostActions = require('./post-actions')
const renderReply = require('./post-reply')
const {timestamp} = require('../lib/util')

// exported api
// =

module.exports = function renderThread () {
  const viewedPost = app.viewedPost
  if (!viewedPost) return ''

  const editingCls = app.isEditingReply ? 'editing' : ''
  return yo`
    <div class="popup-wrapper">
      <div class="popup-inner post-popup">

        ${viewedPost.threadParent && !viewedPost.parents ? yo`
          <div class="loading-container"><div class="spinner"></div></div>
        ` : ''}

        ${viewedPost.parents ? yo`
          <div class="parents">
            ${viewedPost.parents.map(renderReply)}
          </div>`
        : ''}

        <div class="main-post">
          <div class="post-header">
            ${renderAvatar(viewedPost)}

            <div>
              <div class="name" onclick=${e => app.gotoProfile(viewedPost.author, e)}>${viewedPost.author.name}</div>
              <div class="timestamp">${timestamp(viewedPost.createdAt)}</div>
            </div>

            ${renderFollowButton(viewedPost.author)}
          </div>

          <div class="text">${viewedPost.text}</div>

          ${renderPostActions(viewedPost)}
        </div>

        <form class="reply-form ${editingCls}" onsubmit=${onSubmitReply}>
          ${renderAvatar(app.currentUserProfile)}
          <textarea
            placeholder="Write a reply"
            style="border-color: ${app.getThemeColor('border')}"
            onfocus=${onToggleIsReplying}
            onblur=${onToggleIsReplying}
            onkeyup=${onChangeReplyDraft}>${app.replyDraftText}</textarea>
          <div class="actions ${editingCls}">
            ${app.isEditingReply ? yo`<button disabled=${!app.replyDraftText} class="btn new-reply" type="submit">Reply</button>` : ''}
          </div>
        </form>

        ${renderReplies(viewedPost)}
      </div>
    </div>
  `

  async function onSubmitReply (e) {
    e.preventDefault()
    await app.libfritter.feed.post({
      text: app.replyDraftText,
      threadRoot: app.viewedPost.threadRoot || app.viewedPost.getRecordURL(),
      threadParent: app.viewedPost.getRecordURL()
    })
    app.replyDraftText = ''
    app.isEditingReply = false
    
    // reload the post
    app.viewedPost = await app.libfritter.feed.getThread(app.viewedPost.getRecordURL())
    app.render()
  }

  function onToggleIsReplying () {
    if (!app.replyDraftText) {
      app.isEditingReply = !app.isEditingReply
      app.render()
    }
  }

  function onChangeReplyDraft (e) {
    app.replyDraftText = e.target.value
  }
}

// internal methods
// =

function renderReplies (p) {
  if (!(p.replies && p.replies.length)) return ''
  return yo`
    <div class="replies-container">
      <div class="replies">${p.replies.map(renderReply)}</div>
    </div>
  `
}
