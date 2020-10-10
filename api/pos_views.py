from django.shortcuts import render
from django.views.generic import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, permissions, generics
from .serializers import *

from accounts.models import User
from inventory.models import *


class Cart(APIView):
    def get(self, request, format=None):
        if request.user.is_authenticated:
            customer = request.user
            order, created = Order.objects.get_or_create(customer=customer, complete=False)

            items = order.orderitem_set.all()
            item_serializer = cart_items_serializer(items, many=True)

            content = {
                'items': item_serializer.data,
                'cart_items_quantity': order.get_cart_items_quantity,
                'cart_total': order.get_cart_total,
                'order_id': order.id
            }
        else:
            content = {
                'items': [],
                'cart_items_quantity': '',
                'cart_total': '',
                'order_id': ''
            }
        return Response(content)

    def post(self, request, format=None):
        action = request.data['action']
        customer = request.user
        order, created = Order.objects.get_or_create(customer=customer, complete=False)
        if action == 'complete':
            order.complete = True
            order.save()
        else:
            product_code = request.data['product_code']
            product = Product.objects.get(product_code=product_code)
            orderItem, created = OrderItem.objects.get_or_create(order=order, product=product)

            if action == 'add':
                orderItem.quantity = (orderItem.quantity + 1)
            elif action == 'remove':
                orderItem.quantity = (orderItem.quantity - 1)

            orderItem.save()

            if orderItem.quantity <= 0 or action == 'delete':
                orderItem.delete()

            return Response("Item was added/updated")

        return Response("Order Completed")
