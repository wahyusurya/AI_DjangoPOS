# Generated by Django 3.1.2 on 2020-11-05 23:19

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0011_auto_20201105_2315'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='date_order',
            field=models.DateTimeField(default=django.utils.timezone.now, editable=False),
        ),
    ]
