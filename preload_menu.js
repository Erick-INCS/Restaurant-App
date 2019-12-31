// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { query } = require('./database');
const { table_card } = require('./assets/structures');
const usr = require('electron').remote.getGlobal('PUBLIC').usr;

global.getAccess = () => usr.ut_id;

global.genProduct = function(data) {
    let q = "insert into products(p_name, p_unitPrice, p_description, recipe) values (",
    numbers = [`p_id`, `p_unitPrice`];

    for (const v of data) {
            q += indentifyNumberValue(v, numbers) + ', ';
        }
        
    q = q.substring(0, q.length - 2) + ');';
        
    query(q).then(() => {
        loadProducts(true);
        updatePlateOptions();
        $('#btnClearP').click();
    }).catch(err => showModal('Error', err));
};

function indentifyNumberValue(obj, numbers) {
    if (obj.name == 'password') obj.value = `md5('${obj.value}')`;
    return numbers.indexOf(obj.name) != -1 ? obj.value : `'${obj.value}'`;
}

function validNumber(n) {
    n = parseFloat(n);
    return isNaN(n) ? 0 : n;
}

global.genUser = function(data) {
    
    let q = "insert into users(id, name, password, ut_id) values (",
    numbers = [`ut_id`, 'id', 'password'];

    for (const v of data) {
        q += indentifyNumberValue(v, numbers) + ', ';
    }
        
    q = q.substring(0, q.length - 2) + ');';
       
    query(q).then(() => {
        loadUsers(true);
        $('#clearU').click();
    }).catch(err => showModal('Error', err));
};

window.addEventListener('DOMContentLoaded', () => {
    
    G = {};

    //#region inicial
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
    
    for (const type of['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
    //#endregion

    
    //#region mesas
    let tablesContainer = $("#tables-container");

    function getTables() {
        tablesContainer[0].innerHTML = '';
        query('select * from tables;').then((response) => {
        
            for (const tab of response) {
                addTableCard(tablesContainer, tab.t_id);
            }
        }).catch(e => new window.Notification(e));
    }
    getTables();

    $("#newTable").click(() => {

        query('insert into tables values();').then(() => {

            query("select t_id from tables order by t_id desc limit 1;").then((res) => {
                addTableCard(tablesContainer, res[0].t_id);
            });
        });
    });


    $("#deleteTable").click(() => {
        
        query('delete from tables where t_id = (select t_id from tables order by t_id desc limit 1);').then(() => {

            resetAutoIncrement(getTables);

        }).catch(errorDetection);
    });

    updatePlateOptions();

    G.add = (tID, pID) => {
    
        query(`insert into plate values(${pID},${tID});`).then(r => {
            searchPlates(tID, true);
        }).catch(err => showModal('Error', err));
    }

    G.sell = (tID) => {
        let total = $('#price-' + tID)[0].innerHTML.trim().replace('$', '');
        
        if (total) {
            query(`insert into transaction(tr_total, u_id) values(${total}, '${usr.id}');`)
            .then((res) => {
                query(`select tr_id from transaction order by tr_id desc limit 1;`).then(res => {
                    
                    let tr_id = res[0].tr_id;
                    if (tr_id) {
                        let q = `insert into prod_trans(tr_id, p_id) select ${tr_id}, p.p_id
                        from plate as p where p.t_id = ${tID};`;

                        query(q).then(res => {

                            query(`delete from plate where t_id = ${tID};`).then( res => {
                                
                                searchPlates(tID, true);
                                loadTransactions(true);
                                showModal('Reporte de venta', `Importe: ${total}<br>Fecha: ${new Date}<br>Usuario: ${usr.name}`);
                            
                            }).catch(err => showModal('Error', err));


                        }).catch(err => showModal('Error', err));


                    } else {
                        showModal('Error!', 'Transaccion no encontrada');
                    }
                }).catch(err => showModal('Error', err));
            }).catch(err => showModal('Error', err));
        }
    }

    //#endregion


    //#region transacciones

    loadTransactions();

    //#endregion


    //#region productos
    loadProducts();

    G.deleteP = (id, callcback) => {
        
        query("DELETE FROM products WHERE p_id = " + id).then((r) => {
            if (r.affectedRows > 0) {
                
                loadProducts(true);
                callcback(true);
            } else {

                callcback(false);
            }
        }).catch(errorDetection);
    }
    
    //#endregion
    

    //#region users
    loadUsers();    
    
    G.deleteU = (id, callcback) => {
        query("DELETE FROM users WHERE id = " + id).then((r) => {
            if (r.affectedRows > 0) {
                
                loadUsers(true);
                callcback(true);
            } else {

                callcback(false);
            }
        }).catch(errorDetection);
    }

    //#endregion
});

//mesas
function addTableCard(container, id) {
    container.append(table_card({
        id,
        btnAdd: `add(${id})`,
        btnCobrar: `sell(${id})`
    }));  

    searchPlates(id);
}

function searchPlates(tID, reset = false) {

    if (reset) 
        $('#tableItems-' + tID)[0].innerHTML = '';

    query(`select * from plate where t_id = ${tID};`).then((res) => {

        for (const p of res) {
            plate(tID, p.p_id);
        }
    }).catch(err => showModal('Error', err));

    let pricesQ = `select sum(p.p_unitPrice) as total
    from plate
    inner join products as p on plate.p_id = p.p_id
    where plate.t_id = ${tID};`
    
    query(pricesQ).then((res) => {
        let n = res[0].total;
        $('#price-' + tID)[0].innerHTML = n ? ' $' + n : '';
    }).catch(err => showModal('Error', err));
}

function plate(tID, pID) {

    query(`select * from products where p_id = ${pID};`).then((res) => {
        let r = res[0],
        container = $('#tableItems-' + tID),
        item = `
        <div class="au-task__item au-task__item"><!-- item -->
            <div class="au-task__item-inner p-3">
                <h5 class="task text-muted small">
                ${r.p_name}
                </h5>
                <i class="fas fa-times-circle" onclick="cancelP(${tID}, ${pID})" style="float: right;cursor:pointer;"></i>
                <span class="time">$${r.p_unitPrice}</span>
            </div>
        </div><!-- item -->`;
        container.append(item);
    }).catch(err => showModal('Error', err));
}

function optionPlate(plate) {
    return `<option value="${plate.p_id}">${plate.p_name}</option>`;
}

function updatePlateOptions() {
    let select = $('#selectedPlate');
    query('select p_id, p_name from products;').then((response) => {
        
        select[0].innerHTML = '';

        for (const plate of response) {
            
            select.append(optionPlate(plate));
        }
    }); 
}

global.cancelPlate = (t_id, p_id) => {
    query(`delete from plate where t_id = ${t_id} and p_id = ${p_id} limit 1;`)
    .then(r => {
        if (r.affectedRows > 0) {
            searchPlates(t_id, true);
        } else {
            showModal('Ups!', 'Error al eliminar :(');
        }
    }).catch(errorDetection);
}

function resetAutoIncrement(callcback) {
    query("select t_id from tables order by t_id desc limit 1;").then(e => {
        
        query(`alter table tables auto_increment = ${e[0].t_id};`).then(callcback).catch(err => showModal('Error', err))

    }).catch(err => showModal('Error', err));
}

//productos
function loadProducts(restart = false) {
    
    query('select * from products;').then((response) => {
        let table = $('tbody#menuTable');

        if (restart) table[0].innerHTML = '';

        for (const product of response) {
            
            addProduct(product, table);
        }
    });
}

function prTrBody(data) {
    let html = `<tr>
    <td>${data.p_id}</td>
    <td>${data.p_name}</td>
    <td>${data.p_description}</td>
    <td>${data.p_unitPrice}</td>
    <td><a href="javascript: viewRecipe('${data.p_name}', '${data.p_id}')"><i class="fa fa-book"></i></a>`;

    if (usr.ut_id != 1) {
        html += `&nbsp;&nbsp;<a href="javascript: deleteProduct('${data.p_id}')"><i class="fa fa-trash-alt"></i></a>`;
    }

    html += '</td></tr>';

    return html;
}

function addProduct(pr, tbody) {
    tbody.append(prTrBody(pr));
}

global.getRecipe = async (id) => {
    return await query("SELECT recipe FROM products where p_id = " + id).then(r => r[0].recipe);
}

//users
function usrTrBody(data) {
    return `<tr>
    <td>${data.id}</td>
    <td>${data.name}</td>
    <td>${data.type}</td>
    <td><a href="javascript: deleteUser('${data.id}')"><i class="fa fa-trash-alt"></i></a>
    </tr>`;
}

function loadUsers(restart = false) {
    let q = `SELECT u.id, u.name, ut.up_name as type
    from users as u
    inner join user_types as ut on ut.ut_id = u.ut_id;`

    query(q).then((response) => {
        
        let table = $('tbody#usersTable');
        
        if (restart) table[0].innerHTML = '';
        
        for (const user of response) {
            table.append(usrTrBody(user));
        }
    }).catch((e) => showModal('Error!', e));
}

//transactions

function transTrBody(data) {
    return `<tr>
    <td>${data.tr_id}</td>
    <td>${data.name}</td>
    <td>${String(data.tr_date).replace('GMT-0800 (hora estándar del Pacífico)', '')}</td>
    <td>${data.tr_total}</td>
    </tr>`;
}

function loadTransactions(restart = false) {
    let q = `SELECT t.*, u.name
    from transaction as t
    left join users as u on u.id = t.u_id;`

    query(q).then((response) => {
        
        let table = $('tbody#transactionsTable');
        
        if (restart) table[0].innerHTML = '';
        
        for (const user of response) {
            table.append(transTrBody(user));
        }
    }).catch(err => showModal('Error', err));
}

//general
function errorDetection(err) {

    if (err.sqlMessage.indexOf('foreign key') != -1) {
        showModal("Error", 'No es posible eliminar por que se encuentra en uso.');
    } else
        showModal('Error', e);
}