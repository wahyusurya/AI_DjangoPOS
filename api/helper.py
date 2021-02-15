from django.db.models import F
from rest_framework import status
from rest_framework.response import Response

from .serializers import *


def getOrderData(request):
    if 'order_id' not in request.data.keys() and request.user.is_authenticated:
        customer = request.user
        order = OrderNew.objects.get(customer=customer, complete=False)
        order_id = order.id

    else:
        order_id = request.data['order_id']
        order = OrderNew.objects.get(pk=order_id)
    return order, order_id


def BillData(bill_object, self):
    bill_items = reversed(bill_object.stockbillitems_set.all())
    queryset = self.filter_queryset(bill_items)
    bill_item_serializer = self.get_serializer(queryset, many=True)

    content = {
        'bill_name': bill_object.name,
        'bill_vendor': bill_object.vendor.name if bill_object.vendor else None,
        'bill_date_ordered': bill_object.date_ordered,
        'bill_items_quantity': bill_object.get_bill_items_quantity,
        'bill_total': bill_object.get_bill_cost,
        'bill_mrp_total': bill_object.get_bill_mrp,
        'bill_id': bill_object.id,
        'bill_items': bill_item_serializer.data,
    }
    return content


def get_variation_data(product_code):
    variations = ProductVariation.objects.filter(product=product_code)
    variation_data = [ProductVariationPostSerializer(variation).data for variation in variations]

    product = ProductNew.objects.get(pk=product_code)
    product_data = ProductNewSerializer(product).data

    return {'product_data': product_data, 'variation_data': variation_data}


def get_bill_item_data(variation):
    return {
        "product_variation": variation.id,
        "product_code": variation.product.product_code,
        "name": variation.product.name,
        "cost": variation.cost,
        "mrp": variation.mrp,
        "discount_price": variation.discount_price,
        "discount_percentage": variation.discount_percentage,
        "quantity": variation.quantity,
        "quantity_unit": variation.quantity_unit,
        "weight": variation.weight,
        "weight_unit": variation.weight_unit,
        "expiry_date": variation.expiry_date,
        "is_new_variation": False
    }


def get_order_item_data(variation):
    return {
        "product": variation.product.product_code,
        "variation": variation.id,
        "quantity": 1,
    }


def updateProducts_fromBillItems(bill_items):
    for each in bill_items:
        ProductVariation.objects.filter(id=each.product_variation.id).update(
            cost=each.cost,
            mrp=each.mrp,
            discount_price=each.discount_price,
            quantity=F('quantity') + each.stock,
            weight=each.weight,
            expiry_date=each.expiry_date
        )


def add_order_item(request):
    order, order_id = getOrderData(request)

    if 'variation_id' in request.data.keys():
        variation_id = request.data['variation_id']
        variation = ProductVariation.objects.get(pk=variation_id)

    elif 'quick_add_item_name' in request.data.keys():
        name = request.data['quick_add_item_name']
        discount_price = request.data['discount_price']
        quantity = request.data['quantity']
        order_item = OrderItemNew.objects.create(order=order, product=None, quantity=int(quantity), name=name,
                                                 discount_price=float(discount_price))
        order_item.save()
        return Response({'status': 'custom-item_added',
                         'response': '{} was added to order'.format(name), })

    else:
        # Add Variation using Product Code if only one variation is present
        product_code = request.data['product_code']
        try:
            variation = ProductVariation.objects.get(product=product_code)
        except ProductVariation.MultipleObjectsReturned:
            return Response({'multiple_variation_exists': True, **get_variation_data(product_code)})

    try:
        order_item = order.orderitemnew_set.get(variation=variation.id)
        order_item.quantity += 1
        order_item.save()
        return Response({'status': 'quantity_updated', 'response': 'Product quantity updated!',
                         'data': OrderItemNewSerializer(order_item).data})
    except OrderItemNew.MultipleObjectsReturned:
        order_items = order.orderitemnew_set.filter(product_variation=variation.id)
        for i in range(1, len(order_items)):
            order_items[i].delete()
        return Response({'status': 'error',
                         'response': 'Multiple variations were present. Deleted duplicate variations.'})
    except OrderItemNew.DoesNotExist:
        order_item_data = {'order': order_id, **get_order_item_data(variation)}

        # Save bill item
        serializer = OrderItemNewSerializer(data=order_item_data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'order_item_add', 'response': 'Added Order Item.',
                             'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def update_order_item(request):
    order_item = OrderItemNew.objects.get(id=request.data['order_item_id'])
    serializer = OrderItemNewSerializer(order_item, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'updated', 'response': 'Order item details updated.', 'data': serializer.data})


def clear_cart(request):
    if 'order_id' not in request.data.keys() and request.user.is_authenticated:
        customer = request.user
        order = OrderNew.objects.get(customer=customer, complete=False)

    else:
        order_id = request.data['order_id']
        order = OrderNew.objects.get(pk=order_id)

    order.orderitemnew_set.all().delete()
    return Response({'status': 'cart-cleared', 'response': 'Cleared cart successfully.'})


def apply_order_discount(request):
    order, order_id = getOrderData(request)
    sub_action = request.data['sub-action']
    if sub_action == 'apply_discount':
        value = request.data['value']
        is_percentage = request.data['is_percentage']

        discount, created = Discount.objects.get_or_create(value=int(value), is_percentage=is_percentage)
        order.discount = discount
        order.save()
        return Response(
            {"status": "sub-applied",
             "response": "Discount Applied"}
        )

    elif sub_action == 'remove_order_discount':
        order.discount = None
        order.save()
        return Response(
            {"status": "applied",
             "response": "Discount Applied"}
        )


def completeOrder(request):
    order, order_id = getOrderData(request)
    order.complete = True
    if request.data.get('payment_mode'):
        order.payment_mode = request.data['payment_mode']
    order.save()
    return Response(
        {"status": "completed",
         "response": "Order Closed/completed"}
    )
