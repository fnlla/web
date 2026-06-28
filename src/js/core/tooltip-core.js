/*
  ============================================================================
  FNLLA Web SOURCE MODULE: TOOLTIP STATE HELPERS
  Copyright (c) 2026 TechAyo LTD (techayo.co.uk). Released under the MIT License.
  ============================================================================
*/

  /* Position one tooltip around its trigger while keeping it on-screen. */
  function positionTooltipPanel(trigger, panel) {
    var placement = trigger.getAttribute(attributeNames.tooltipPosition) || "top";
    var triggerRect = trigger.getBoundingClientRect();
    var panelRect = panel.getBoundingClientRect();
    var top = 0;
    var left = 0;

    if (placement === "bottom") {
      top = triggerRect.bottom + 10;
      left = triggerRect.left + ((triggerRect.width - panelRect.width) / 2);
    } else if (placement === "left") {
      top = triggerRect.top + ((triggerRect.height - panelRect.height) / 2);
      left = triggerRect.left - panelRect.width - 10;
    } else if (placement === "right") {
      top = triggerRect.top + ((triggerRect.height - panelRect.height) / 2);
      left = triggerRect.right + 10;
    } else {
      top = triggerRect.top - panelRect.height - 10;
      left = triggerRect.left + ((triggerRect.width - panelRect.width) / 2);
    }

    top = Math.max(8, Math.min(top, window.innerHeight - panelRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - panelRect.width - 8));

    panel.style.top = top + "px";
    panel.style.left = left + "px";
  }

  /* Show one tooltip, creating its shared DOM node if needed. */
  function showTooltip(trigger) {
    var text = trigger ? trigger.getAttribute(attributeNames.tooltip) : "";
    var panel = tooltipPanelMap.get(trigger);

    if (!trigger || !text) {
      return;
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.className = "tooltip-panel";
      panel.id = createFnllaUiId(idPrefixes.tooltip);
      panel.setAttribute("role", "tooltip");
      document.body.appendChild(panel);
      tooltipPanelMap.set(trigger, panel);

      if (!trigger.getAttribute("aria-describedby")) {
        trigger.setAttribute("aria-describedby", panel.id);
      }
    }

    panel.textContent = text;
    panel.hidden = false;
    positionTooltipPanel(trigger, panel);
    panel.classList.add("is-visible");
  }

  /* Hide one tooltip while keeping its DOM node reusable for next show. */
  function hideTooltip(trigger) {
    var panel = tooltipPanelMap.get(trigger);

    if (!panel) {
      return;
    }

    panel.classList.remove("is-visible");
    panel.hidden = true;
  }
