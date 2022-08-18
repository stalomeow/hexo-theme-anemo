import $ from '../$';
import { IComponent } from '../component';

const sidebarSelector = '.sidebar';
const sidebarSwitchesSelector = '.sidebar-switches';
const sidebarPanelsSelector = '.sidebar-panels';
const sidebarTogglerSelector = '.sidebar-toggler';
const sidebarMaskSelector = '.sidebar-mask';

const sidebarOpenAttr = 'show';
const sidebarTogglerOpenClass = 'open';

const sidebarSwitchTargetPanelAttr = 'target-panel';

const panel_attr = 'panel';
const panel_toc = 'toc';
const panel_overview = 'overview';

const tocPanelSelector = '.toc';

let sidebar: HTMLElement;
let sidebarSwitches: HTMLElement;
let sidebarPanels: HTMLElement;
let sidebarToggler: HTMLElement;
let isSidebarOpened = false;

function openSidebar() {
  sidebar.attr(sidebarOpenAttr, '');
  sidebarToggler.addClass(sidebarTogglerOpenClass);
  isSidebarOpened = true;
}

function closeSidebar() {
  sidebar.attr(sidebarOpenAttr, null);
  sidebarToggler.removeClass(sidebarTogglerOpenClass);
  isSidebarOpened = false;
}

const component_sidebar: IComponent = {
  name: 'sidebar',

  initialize(): boolean {
    sidebar = $.assert<HTMLElement>(sidebarSelector);
    sidebarSwitches = $.assert<HTMLElement>(sidebarSwitchesSelector);
    sidebarPanels = $.assert<HTMLElement>(sidebarPanelsSelector);
    sidebarToggler = $.assert<HTMLElement>(sidebarTogglerSelector);

    // toggle sidebar
    sidebarToggler.addEventListener('click', () => {
      if (isSidebarOpened) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    // switch panel
    const switches = sidebarSwitches.children;
    for (let i = 0; i < switches.length; i++) {
      const panel = switches[i].attr(sidebarSwitchTargetPanelAttr);
      switches[i].addEventListener('click', () => {
        // switch to the target panel
        sidebarPanels.attr(panel_attr, panel);
      });
    }

    // close sidebar
    const mask = $.assert<HTMLElement>(sidebarMaskSelector);
    mask.addEventListener('click', () => closeSidebar());

    return true;
  },

  refresh(): void {
    const toc = $(tocPanelSelector, sidebarPanels);

    if (toc) {
      sidebarSwitches.css('display', null);
      sidebarPanels.attr(panel_attr, panel_toc);
    } else {
      sidebarSwitches.css('display', 'none');
      sidebarPanels.attr(panel_attr, panel_overview);
    }

    closeSidebar(); // force close
  }
};

export default component_sidebar;