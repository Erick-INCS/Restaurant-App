function table_card(data) {

  return `
  <div class="col-4" id="table-${data.id}"> <!-- Mesa -->
    <div class="au-card au-card--no-shadow au-card--no-pad m-b-40">
        <div class="au-card-title p-3">
            <div class="bg-overlay bg-overlay--blue"></div>
            <h3 class="h5"><i class="fa fa-utensils"></i>Mesa ${data.id}&nbsp;&nbsp;&nbsp;&nbsp;<span class="text-dark font-italic" id="price-${data.id}"></span></h3>
            <button class="au-btn-plus" onclick="${data.btnAdd}">
                <i>+</i>
            </button>
        </div>
        <div class="au-task js-list-load">
            <div class="au-task-list js-scrollbar3" id="tableItems-${data.id}">
                
            </div>
            <div class="au-task__footer p-2">
                <button class="btn btn-primary" onclick="${data.btnCobrar}">Cobrar</button>
            </div>
        </div>
    </div>
  </div> <!-- Mesa -->`;
}

function trTBody(values, last) {
  let html = '<tr>';
  
  for (const val of values) {
    html += `<td${val.class ? ` class="${val.class}">` : '>'}${val.value ? val.value : val}</td>`;
  }

  if (last) html += last;

  html += '</tr>';
  return html;
}

module.exports = {
  table_card,
  trTBody
}