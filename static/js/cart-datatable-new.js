const dataTable = $("#cart-datatable");
let updated_product_code = 0;
let updated_product_id = 0;
let total_cart_value = 0;

function loadCartData() {
    let url = '/api/cart-datatable/?format=datatables';
    return dataTable.DataTable({
        ajax: {
            'url': url,
            'dataSrc': 'data.order_items',
        },
        "language": {
            "emptyTable": '<div class="alert alert-primary text-center" role="alert">No products in the cart. Start by adding some products!</div>'
        },
        "initComplete": function () {
            const myCustomScrollbar = document.querySelector('#cart-datatable_wrapper .dataTables_scrollBody');
            new PerfectScrollbar(myCustomScrollbar);
        },
        "scrollY": "48vh",
        "paging": false,
        'dom': "t",
        'fixedHeader': {
            header: true,
            footer: true
        },
        "rowCallback": function (row, data, dataIndex) {
            if (data.product_code === updated_product_code || data.id === updated_product_id ) {
                $(row).addClass('clicked');
                updated_product_code = 0;
                updated_product_id = 0;

            }
        },
        'columns': [
            {'data': 'product_name', 'class': 'text-left font-weight-bold'},
            {'data': 'weight', 'width': '10%', render: handleBlankData},
            {'data': 'mrp', 'width': '10%', render: function (data, type, row) {
                    return `<div class="input-group" style="width: 70px">
                              <input class="form-control input-sm quantity cart-quant px-1 text-center quantity_cart" 
                              min="0" name="discount_price_cart" value="${data}" type="number" onchange="updateCartByValue(${row.id}, 'edit_mrp', this.value)"></div>`
                }},
            {'data': 'discount_price', 'width': '12%', render: function (data, type, row) {
                    return `<div class="input-group" style="width: 70px">
                              <input class="form-control input-sm quantity cart-quant px-1 text-center quantity_cart" 
                              min="0" name="discount_price_cart" value="${data}" type="number" onchange="updateCartByValue(${row.id}, 'edit_discount_price', this.value)"></div>`
                }},
            {
                'data': 'quantity', 'width': '10%', render: function (data, type, row) {
                    return `<div class="input-group " style="width: 70px">
                              <div class="input-group-prepend">
                                <button class="btn btn-sm btn-primary btn-rounded m-0 px-2 py-0 z-depth-0 
                                waves-effect minus decrease" onclick="updateCartByQuantityValue(this, ${row.id}, 'remove')"
                                > <i class="fas fa-minus"></i> </button>
                              </div>
                              <input class="form-control input-sm quantity cart-quant px-1 text-center quantity_cart" 
                              min="0" name="quantity_cart" value="${data}" type="number" onchange="updateCartByQuantityValue(this, ${row.id}, 'value')">
                              <div class="input-group-append">
                                <button class="btn btn-sm btn-primary btn-rounded m-0 px-2 py-0 z-depth-0 waves-effect 
                                plus increase" onclick="updateCartByQuantityValue(this, ${row.id}, 'add')"
                                ><i class="fas fa-plus"></i></button>
                              </div>
                            </div>`

                    // return `${data}<div class="btn-group ml-3" data-toggle="buttons">
                    //             <button class="btn btn-sm btn-primary btn-rounded" onclick="updateUserOrderById('${row.id}', 'remove_quantity')"><i class="fas fa-minus"></i></button>
                    //             <button class="btn btn-sm btn-primary btn-rounded" onclick="updateUserOrderById('${row.id}', 'add_quantity')"><i class="fas fa-plus"></i></button>
                    //         </div>`
                }
            },
            {'data': 'amount', 'width': '12%'},
            {
                'data': 'id', 'width': '10%', render: function (data) {
                    // console.log(data);
                    return `<button class="btn btn-danger btn-sm btn-rounded mr-4" title="Delete Product" onclick="updateUserOrderById('${data}', 'delete_byId')"><i class="fas fa-trash"></i></button>`
                },
                "orderable": false,
            },
        ],
        'drawCallback': function () {
            let api = this.api();
            let json = api.ajax.json();

            let discount = 'NA'
            let remove_discount = ''
            if (json.data.order.discount != null) {
                discount = json.data.order.discount
                remove_discount = `<button class="btn btn-sm btn-danger btn-rounded ml-3 py-0 px-2 my-0" 
                                    onclick="updateUserOrder('${json.data.order.id}', 'remove_order_discount')">
                                    <i class="fas fa-times"></i></button>`
                if (discount.is_percentage === true) discount = discount.value + '%'
                else discount = '₹' + discount.value
            }

            // let html = `<tr><th class="table-info font-weight-500 h6">Total Quantity -
            //                 <span class="font-weight-bold">${json.data.order.get_cart_items_quantity}</span></th>
            //                 <th class="table-warning font-weight-500 h6">Total Amount -
            //                 <span class="font-weight-bold">₹${json.data.order.get_cart_revenue}</span></th>
            //                 <th class="table-success font-weight-500 h6">Cart Discount -
            //                 <span class="font-weight-bold">${discount}</span>${remove_discount}</th>
            //             </tr>`
            let html = `<div class="col-sm-4 table-info font-weight-500 text-center py-3 h6">Total Quantity -  <span class="font-weight-bold">${json.data.order.get_cart_items_quantity}</span></div>
                        <div class="col-sm-4 table-warning font-weight-500 text-center py-3 h6">Total Amount -  <span class="font-weight-bold">₹${json.data.order.get_cart_revenue}</span></div>
                        <div class="col-sm-4 table-success font-weight-500 text-center py-3 h6">Cart Discount -  <span class="font-weight-bold">${discount}</span>${remove_discount}</div>`
            total_cart_value = json.data.order.get_cart_revenue;
            // $(dataTable.DataTable().table().footer()).html(html);
            $('#total-values-div').html(html);

            let cash_received = $('#CashReceivedValue').val()
            if (cash_received !== "") {
                calculateRefund(cash_received)
            }
        },
    });
}


function updateUserOrder(product_code, action) {
    let url = "/api/cart/"
    let method = 'POST'
    if (action === 'clear' || action === 'remove_order_discount') {
        method = 'PUT'
    }

    $.ajax(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        data: JSON.stringify({'product_code': String(product_code), 'action': action}),
        success: function (data) {
            // console.log(data)
            updated_product_code = product_code;
            dataTable.DataTable().draw('page');
        },
        error: function () {
            toastr.error('Could not update cart! Please Try Again.');
        },
        complete: function () {

        }
    })
}

function updateUserOrderById(orderitem_id, action) {
    let url = "/api/cart/"
    let method = 'POST'

    $.ajax(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        data: JSON.stringify({'orderitem_id': orderitem_id, 'action': action}),
        success: function (data) {
            // console.log(data)
            updated_product_id = Number(orderitem_id);
            dataTable.DataTable().draw('page');
        },
        error: function () {
            toastr.error('Could not update cart! Please Try Again.');
        },
        // complete: function () {
        //
        // }
    })
}

function updateCartByQuantityValue(elem, id_item, action) {
    let quantity = 1;
    if (action ==='add'){
        elem.parentNode.parentNode.querySelector('input[type=number]').stepUp();
        quantity = elem.parentNode.parentNode.querySelector('input[type=number]').value
    }
    else if (action ==='remove'){
        elem.parentNode.parentNode.querySelector('input[type=number]').stepDown();
        quantity = elem.parentNode.parentNode.querySelector('input[type=number]').value
    }
    else {
        quantity = elem.value;
        elem.blur();
    }
    // toastr.error('Quantity' + quantity + id_item);

    let url = "/api/cart/"

    $.ajax(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        data: JSON.stringify({
            'action': 'add_quantity_by_input',
            'orderitem_id': id_item,
            'quantity_by_id': quantity,
        }),
        success: function (data) {
            // console.log(data)
            updated_product_id = Number(id_item);
            dataTable.DataTable().draw('page');
        },
        error: function () {
            toastr.error('An error occurred please check the value entered');
        },
        // complete: function () {
        // }
    })
}

function updateCartByValue(id_item, action, value) {
    let url = "/api/cart/"

    $.ajax(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        data: JSON.stringify({
            'action': action,
            'value': value,
            'orderitem_id': id_item,
        }),
        success: function (data) {
            // console.log(data)
            updated_product_id = Number(id_item);
            dataTable.DataTable().draw('page');
        },
        error: function () {
            toastr.error('An error occurred please check the value entered');
        },
        // complete: function () {
        // }
    })
}



function product_search(value) {
    let url = '/api/search-products';

    $.getJSON(url, {'search_term': value}, function (response) {
        let trHTML = '';
        if (response.products === undefined || response.products.length === 0) {
            trHTML += `<li><div class="alert alert-secondary" role="alert">  No Products Found</div></li>`
        } else {
            $.each(response.products, function (e, item) {
                trHTML += `<li class="list-group-item">
                            <div class="row pt-2 ">
                                <div class="col"><div>${item.name}</div>
                                    <div class="row">
                                       <div class="col"><span class="align-middle text-muted small">Code: ${item.product_code}</span></div>
                                       <div class="col-auto"><span class="align-middle text-muted small float-right"> ₹${item.discount_price}</span></div>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <button type="button" onclick="updateUserOrder('${item.product_code}', 'add')" class="btn btn-primary btn-sm mr-1">
                                        <i class="fas fa-shopping-cart"> +</i>
                                    </button>
                                </div>
                            </div></li>`
            })
        }
        $("#AllProductListLi").empty().append(trHTML);
    });
}


function completePos() {
    setTimeout(function () {
        // $('#horizontal-stepper').nextStep();
        window.location.reload();
        $('#horizontal-stepper').nextStep();
    }, 500);

}


// SCANNER INPUT
// $(function () {
//     $(document).pos();
//     $(document).on('scan.pos.barcode', function (event) {
//         updateUserOrder(event.code, 'add')
//     });
// });

// Initialize with options
onScan.attachTo(document, {
    suffixKeyCodes: [13], // enter-key expected at the end of a scan
    reactToPaste: true, // Compatibility to built-in scanners in paste-mode (as opposed to keyboard-mode)
    onScan: function(sCode) { // Alternative to document.addEventListener('scan')
        console.log('abcds', sCode);
        // addBillItemToBill(sCode);
        updateUserOrder(sCode, 'add')
    },
});
// END SCANNER INPUT

// Refund Calculator
function calculateRefund(cash) {
    let cart_total_amount = total_cart_value
    // cart_total_amount = parseInt(cart_total_amount.innerText)inventory_orderitem
    // cash = parseInt(cash)
    // console.log(cart_total_amount - cash)
    if (cash < cart_total_amount) {
        document.getElementById('RefundAmount').innerHTML = "Less Cash Received";
    } else if (cash >= cart_total_amount) {
        document.getElementById('RefundAmount').innerHTML = "Refund: ₹" + (cash - cart_total_amount).toString();
    } else {
        document.getElementById('RefundAmount').innerHTML = "No items to calculate or unknown error";
    }
}

function CompleteOrder() {
    let payment_mode = document.getElementById("payment-mode")
    let url = "/api/cart/"

    $.ajax(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        data: JSON.stringify({'product_code': null, 'action': 'complete', 'payment-mode': payment_mode.value}),
        success: function (data) {
            // console.log(data)
        }
    })
}

$('#CashReceivedValue').on('input', function () {
    calculateRefund($(this).val())
});

function quickAddProduct() {
    let url = "/api/cart/"
    let name = document.getElementById('qa_name').value
    let quantity = document.getElementById('qa_quantity').value
    let discount_price = document.getElementById('qa_discount_price').value

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            'name': name,
            'discount_price': discount_price,
            'quantity': quantity,
            'action': 'quick_add'
        })
    })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            // console.log(data)
            // updated_product_id = data.id;
            dataTable.DataTable().draw('page');
            toastr.success(data.response_text)
        }).catch(error => {
        //Here is still promise
        // console.log(error);
        toastr.error('An error occurred please check the values entered')
    })
}


function discountOrder() {
    let url = "/api/cart/"
    let value = document.getElementById('discount_value').value
    let is_percentage = document.getElementById("discount_value_checkbox").checked

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            'action': 'apply_discount',
            'value': value,
            'is_percentage': is_percentage,
        })
    })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            // console.log(data)
            dataTable.DataTable().draw('page');
            toastr.success(data.response_text)
        }).catch(error => {
        //Here is still promise
        // console.log(error);
        toastr.error('An error occurred please check the value entered')
    })
}




function open_receipt_and_reload(url) {
    // CompleteOrder()
    // //Open in new tab
    // window.open(url, '_blank');
    // //focus to that window
    // window.focus();
    // //reload current page
    // location.reload();


    let payment_mode = document.getElementById("payment-mode")
    let url2 = "/api/cart/"

    $.ajax(url2, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        data: JSON.stringify({'product_code': null, 'action': 'complete', 'payment-mode': payment_mode.value}),
        complete: function () {
            //Open in new tab
            window.open(url, '_blank');
            //focus to that window
            window.focus();
            //reload current page

            location.reload();
        }
    })

}


$(document).ready(function () {
    $("#AllProductList").on("input", function () {
        let value = $(this).val().toLowerCase();
        product_search(value)
    });
    product_search(null)
    loadCartData();
    $('.stepper').mdbStepper();
    // const myCustomScrollbar = document.querySelector('#AllProductListLi');
    // const ps = new PerfectScrollbar(myCustomScrollbar);
});
