# Generated by Django 3.1.2 on 2020-10-29 23:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0004_product_discount_percentage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='product_code',
            field=models.CharField(max_length=30, primary_key=True, serialize=False),
        ),
    ]