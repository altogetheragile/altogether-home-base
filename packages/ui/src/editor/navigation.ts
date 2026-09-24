import type { CopyRegistry } from './fields';

// The menu and the footer. Shared, because both apps draw a menu and both mount the editor.
export const navigationRegistry: CopyRegistry = {
  "page": "navigation",
  "label": "Navigation and Footer",
  "entries": {
    "nav.resources.visible": {
      "value": "",
      "label": "Show the Resources menu",
      "hint": "Off, and the drop-down goes, along with everything inside it. The pages themselves stay reachable by their own addresses.",
      "type": "switch",
      "store": "column",
      "path": "show_resources"
    },
    "nav.events": {
      "value": "Events",
      "label": "Events link",
      "hint": "The menu label for the events listing. The page lives at /events whatever you call it here."
    },
    "nav.coaching": {
      "value": "Coaching",
      "label": "Coaching link",
      "hint": "What you call the service you sell. Many freelancers prefer Services or Consulting. The page lives at /coaching whatever you call it here."
    },
    "nav.about": {
      "value": "About",
      "label": "About link",
      "hint": "The menu label for the about page"
    },
    "nav.contact": {
      "value": "Contact",
      "label": "Contact link",
      "hint": "The menu label for the contact page"
    },
    "nav.testimonials": {
      "value": "Testimonials",
      "label": "Testimonials link",
      "hint": "The menu label for the testimonials page"
    },
    "nav.resources": {
      "value": "Resources",
      "label": "Resources menu",
      "hint": "The drop-down that gathers the blog, the knowledge base and anything else switched on"
    },
    "nav.knowledge": {
      "value": "Knowledge Base",
      "label": "Knowledge base link",
      "hint": "Inside the Resources drop-down"
    },
    "nav.knowledge.visible": {
      "value": "",
      "label": "Show it",
      "hint": "Off, and the knowledge base leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_knowledge"
    },
    "nav.blog": {
      "value": "Blog",
      "label": "Blog link",
      "hint": "Inside the Resources drop-down"
    },
    "nav.blog.visible": {
      "value": "",
      "label": "Show it",
      "hint": "Off, and the blog leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_blog"
    },
    "nav.exams": {
      "value": "Practice Exams",
      "label": "Practice exams link",
      "hint": "Inside the Resources drop-down"
    },
    "nav.exams.visible": {
      "value": "",
      "label": "Show it",
      "hint": "Off, and the practice exams leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_exams"
    },
    "nav.ai_tools": {
      "value": "AI Tools",
      "label": "AI tools link",
      "hint": "Inside the Resources drop-down"
    },
    "nav.ai_tools.visible": {
      "value": "",
      "label": "Show it",
      "hint": "Off, and the AI tools leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_ai_tools"
    },
    "nav.flow_game": {
      "value": "Flow Game",
      "label": "Flow game link",
      "hint": "Inside the Resources drop-down"
    },
    "nav.flow_game.visible": {
      "value": "",
      "label": "Show it",
      "hint": "Off, and the flow game leaves the menu and answers Not Found for everybody except you. The other items in Resources are unaffected.",
      "type": "switch",
      "store": "column",
      "path": "show_flow_game"
    },
    "nav.home": {
      "value": "Home",
      "label": "Home link",
      "hint": "Shown in the footer's quick links"
    },
    "footer.quicklinks": {
      "value": "Quick Links",
      "label": "Footer links heading",
      "hint": "The heading above the list of links in the footer"
    },
    "footer.contact": {
      "value": "Contact",
      "label": "Footer contact heading",
      "hint": "The heading above the email address and phone number in the footer"
    }
  }
} as CopyRegistry;
