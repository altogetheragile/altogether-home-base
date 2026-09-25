import { colors } from './chunk-63HQX2YB.js';

// src/editor/site.ts
var siteRegistry = {
  "page": "site",
  "label": "This Site",
  "entries": {
    "site.managed": {
      "value": "",
      "label": "Sites you look after",
      "hint": "This site and any other built from the same software. Listed on the Sites page, which only you can see. Nothing here reaches those sites: it is a list of addresses.",
      "type": "items",
      "fields": [
        { "key": "name", "label": "What you call it", "placeholder": "Her Business", "required": true },
        { "key": "domain", "label": "Address", "placeholder": "herbusiness.com", "required": true },
        { "key": "note", "label": "Note to self", "placeholder": "Whose it is, or what is still to do" }
      ]
    },
    "site.company_name": {
      "value": "",
      "label": "Business name",
      "hint": "Shown in the menu when there is no logo, in the footer, in the browser tab and in what Google indexes.",
      "store": "column",
      "path": "company_name"
    },
    "site.company_description": {
      "value": "",
      "label": "One-line description",
      "hint": "The sentence under the name in the footer, and what search engines quote. One sentence works best.",
      "store": "column",
      "path": "company_description"
    },
    "site.copyright_text": {
      "value": "",
      "label": "Copyright line",
      "hint": "After the year and the business name at the very bottom.",
      "store": "column",
      "path": "copyright_text"
    },
    "site.brand.images.logo": {
      "value": "",
      "label": "Logo",
      "hint": "Top left of every page. Leave it empty and the business name is used as words, which often looks better than a stretched image.",
      "type": "image",
      "store": "brand",
      "path": "images.logo"
    },
    "site.brand.wordmark.twoTone": {
      "value": "",
      "label": "Two-tone wordmark",
      "hint": "Only used when no logo is uploaded. Sets the business name in capitals with the last word in your accent colour, which reads as a designed mark rather than as text. Check it before leaving it on: a one-word name written as two, like StreamStrategy, comes apart correctly, but so does a name like McKenzie.",
      "type": "switch",
      "store": "brand",
      "path": "wordmark.twoTone",
      "says": { "on": "Name set in two colours", "off": "Name set plainly" }
    },
    "site.brand.images.favicon": {
      "value": "",
      "label": "Browser tab icon",
      "hint": "The small square in the browser tab and in a bookmark.",
      "type": "image",
      "store": "brand",
      "path": "images.favicon"
    },
    "site.brand.images.ogImage": {
      "value": "",
      "label": "Social sharing picture",
      "hint": "What appears when somebody pastes a link to this site into Slack, LinkedIn or a message. Wide, around 1200 by 630.",
      "type": "image",
      "store": "brand",
      "path": "images.ogImage"
    },
    "site.brand.images.founderPhoto": {
      "value": "",
      "label": "Founder photograph",
      "hint": "The photograph on the home page and the about page.",
      "type": "image",
      "store": "brand",
      "path": "images.founderPhoto"
    },
    "site.brand.images.founderPortrait": {
      "value": "",
      "label": "Founder portrait",
      "hint": "The smaller cut-out used beside the closing call to action.",
      "type": "image",
      "store": "brand",
      "path": "images.founderPortrait"
    },
    "site.brand.colors.orange": {
      "value": colors.orange,
      "label": "Accent colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.orange"
    },
    "site.brand.colors.deepTeal": {
      "value": colors.deepTeal,
      "label": "Deep colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.deepTeal"
    },
    "site.brand.colors.midTeal": {
      "value": colors.midTeal,
      "label": "Mid colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.midTeal"
    },
    "site.brand.colors.skyTeal": {
      "value": colors.skyTeal,
      "label": "Pale colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.skyTeal"
    },
    "site.brand.colors.paleTeal": {
      "value": colors.paleTeal,
      "label": "Palest colour",
      "hint": "Used across the whole site. Changing it changes every page at once.",
      "type": "colour",
      "store": "brand",
      "path": "colors.paleTeal"
    },
    "site.show_founder": {
      "value": "",
      "label": "Show the founder",
      "hint": "Off, and no photograph, biography or Person data appears anywhere. A business that does not lead with a person should leave this off.",
      "type": "switch",
      "store": "column",
      "path": "show_founder"
    },
    "site.founder_name": {
      "value": "",
      "label": "Founder name",
      "hint": "Used in the alt text of the photograph and in the structured data search engines read.",
      "store": "column",
      "path": "founder_name"
    },
    "site.founder_role": {
      "value": "",
      "label": "Founder job title",
      "hint": 'For search engines, for example "Agile Coach". Leave empty to claim none.',
      "store": "column",
      "path": "founder_role"
    },
    "site.founder_expertise": {
      "value": "",
      "label": "What the founder is known for",
      "hint": "One per line, for search engines. These are claims about a named person, so only list what is true.",
      "type": "textarea",
      "store": "column",
      "path": "founder_expertise"
    },
    "site.contact_email": {
      "value": "",
      "label": "Email address",
      "hint": "Shown in the footer and on the contact page.",
      "store": "column",
      "path": "contact_email"
    },
    "site.contact_phone": {
      "value": "",
      "label": "Telephone",
      "hint": "Leave empty and no number appears.",
      "store": "column",
      "path": "contact_phone"
    },
    "site.contact_location": {
      "value": "",
      "label": "Where you are",
      "hint": 'For example "Manchester, United Kingdom".',
      "store": "column",
      "path": "contact_location"
    },
    "site.social_linkedin": {
      "value": "",
      "label": "LinkedIn address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_linkedin"
    },
    "site.social_twitter": {
      "value": "",
      "label": "Twitter address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_twitter"
    },
    "site.social_facebook": {
      "value": "",
      "label": "Facebook address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_facebook"
    },
    "site.social_youtube": {
      "value": "",
      "label": "YouTube address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_youtube"
    },
    "site.social_github": {
      "value": "",
      "label": "GitHub address",
      "hint": "The full web address. Leave empty and the icon does not appear.",
      "store": "column",
      "path": "social_github"
    }
  }
};

export { siteRegistry };
