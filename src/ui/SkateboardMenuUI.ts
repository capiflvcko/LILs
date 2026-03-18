export class SkateboardMenuUI {
  private readonly overlay: HTMLDivElement;
  private readonly rideButton: HTMLButtonElement;
  private readonly cancelButton: HTMLButtonElement;
  private onRide: (() => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.inset = '0';
    this.overlay.style.display = 'none';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.background = 'rgba(23, 29, 18, 0.42)';
    this.overlay.style.backdropFilter = 'blur(2px)';
    this.overlay.style.zIndex = '3000';

    const panel = document.createElement('div');
    panel.style.width = 'min(340px, calc(100vw - 40px))';
    panel.style.padding = '22px 22px 18px';
    panel.style.borderRadius = '16px';
    panel.style.background = 'rgba(255, 248, 229, 0.98)';
    panel.style.border = '3px solid rgba(88, 119, 45, 0.58)';
    panel.style.boxShadow = '0 18px 40px rgba(36, 49, 16, 0.26)';
    panel.style.fontFamily = '"Courier New", monospace';
    panel.style.color = '#2d341b';
    panel.addEventListener('click', event => event.stopPropagation());

    panel.innerHTML = `
      <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.62;">Town Gear</div>
      <h2 style="margin:8px 0 10px;font-size:28px;line-height:1;">Ride Board?</h2>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.5;">
        This skateboard is parked and ready. Hop on and cruise the block?
      </p>
    `;

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';

    this.rideButton = document.createElement('button');
    this.rideButton.textContent = 'Ride';
    this.rideButton.style.flex = '1';
    this.rideButton.style.border = 'none';
    this.rideButton.style.borderRadius = '999px';
    this.rideButton.style.padding = '12px 14px';
    this.rideButton.style.background = '#5d8e33';
    this.rideButton.style.color = '#fff9e8';
    this.rideButton.style.font = '700 14px "Courier New", monospace';
    this.rideButton.style.cursor = 'pointer';

    this.cancelButton = document.createElement('button');
    this.cancelButton.textContent = 'Not now';
    this.cancelButton.style.flex = '1';
    this.cancelButton.style.border = '2px solid rgba(88, 119, 45, 0.28)';
    this.cancelButton.style.borderRadius = '999px';
    this.cancelButton.style.padding = '10px 14px';
    this.cancelButton.style.background = '#fffdf3';
    this.cancelButton.style.color = '#4b5830';
    this.cancelButton.style.font = '700 14px "Courier New", monospace';
    this.cancelButton.style.cursor = 'pointer';

    actions.append(this.rideButton, this.cancelButton);
    panel.appendChild(actions);
    this.overlay.appendChild(panel);
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', () => this.hide());
    this.cancelButton.addEventListener('click', () => this.hide());
    this.rideButton.addEventListener('click', () => {
      this.onRide?.();
      this.hide();
    });

    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  show(onRide: () => void): void {
    this.onRide = onRide;
    this.overlay.style.display = 'flex';
  }

  hide(): void {
    this.overlay.style.display = 'none';
    this.onRide = null;
  }

  isVisible(): boolean {
    return this.overlay.style.display !== 'none';
  }
}
