# Generated by Django 3.1.2 on 2020-11-05 22:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0005_auto_20201029_2352'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='category',
        ),
    ]
