# JPDB Ease Review Load

Tested with Tampermonkey on Opera. As far as I know it should work with any major browsers and script managers but please help others by [reporting it](https://github.com/JaiWWW/jpdb-ease-review-load/issues/new) if it doesn't, and I might look into it! (no promises though)

## Introduction
When I have lots of reviews due, I feel less motivated to do them, so I made this script to help me stay motivated!

## Installation
> To install this script, make sure you have Tampermonkey (may or may not work with other script managers) and then click [here](https://github.com/JaiWWW/jpdb-ease-review-load/raw/main/script.user.js), or click <ins>script.user.js</ins> above and then click the **Raw** button.

## How it works
- Allows the user to set a `threshold` (default: 40) and a `limit` (default: 30) at the top of the script code.
- The script activates if the number of due reviews (`due count`) is greater than the `threshold`.
> When the script activates, it starts displaying your `due count` as the `limit` you set in settings instead of your `actual due count`.
- While the script is activated, the `displayed due count` decreases as normal as you do reviews.
- It also increases as normal if new reviews become due, but it won't exceed the `limit`.
> The difference between your `actual` and `displayed due counts` will increase in this case, so the `displayed due count` will ***always*** decrease when you do a review.
- When your `displayed due count` reaches 0, you get a `review block finished` page, just like when you finish all your reviews normally!
> This gives you a rewarding feeling like when you finish all your due reviews, so you will feel encouraged to finish your review block and hopefully to keep going afterwards too!
