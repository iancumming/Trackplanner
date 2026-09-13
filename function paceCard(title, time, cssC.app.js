function paceCard(title, time, cssClass) {
  return `
    <div class="pace-card ${cssClass}">
      <h3>${title}</h3>
      <p>${time}</p>
    </div>
  `;
}
