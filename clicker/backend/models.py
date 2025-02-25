from copy import copy
from django.db import models
from django.contrib.auth.models import User
from .constants import *


class Core(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    coins = models.IntegerField(default=0) # деньги
    power = models.IntegerField(default=1) # заработок денег
    lvl = models.IntegerField(default=1)
    auto_click_power = models.IntegerField(default=0) #стипендия
    brs_points = models.FloatField(default=0)
    brs_power = models.FloatField(default=0.01)

    # Метод для установки текущего количества монет пользователя.
    def set_coins(self, coins, auto_click_power, brs_points, commit=True):
        self.coins = coins  # Теперь мы просто присваиваем входящее значение монет.
        self.auto_click_power = auto_click_power
        self.brs_points = brs_points
        is_levelupdated = self.is_levelup()  # Проверка на повышение уровня.
        boost_type = self.get_boost_type()  # Получение типа буста, который будет создан при повышении уровня.

        if is_levelupdated:
            self.lvl += 1

        if commit:
            self.save()

        return is_levelupdated, boost_type


    # Выделили проверку на повышение уровня в отдельный метод для чистоты кода.
    def is_levelup(self):
        return self.coins >= self.calculate_next_level_price()

    # Выделили получение типа буста в отдельный метод для удобства.
    def get_boost_type(self):
        boost_type = 0
        if (self.lvl % 3 ==0) and (self.lvl % 5 != 0):
            boost_type = 1
        if self.lvl % 5 ==0:
            boost_type = 2
        return boost_type

    # Поменяли название с check_level_price, потому что теперь так гораздо больше подходит по смыслу.
    def calculate_next_level_price(self):
        return (self.lvl ** 2) * 10 * (self.lvl)


class Boost(models.Model):
    core = models.ForeignKey(Core, on_delete=models.CASCADE)
    lvl = models.IntegerField(default=1)
    price = models.IntegerField(default=10)
    power = models.IntegerField(default=1)
    brs_power = models.FloatField(default=0)
    type = models.PositiveSmallIntegerField(default=0, choices=BOOST_TYPE_CHOICES)

    def levelup(self, current_coins):
        if self.price > current_coins:  # Если монет недостаточно, ничего не делаем.
            return False

        old_boost_stats = copy(self)

        self.core.coins = current_coins - self.price  # Обновляем количество монет в базе данных.
        self.core.power += self.power * BOOST_TYPE_VALUES[self.type]['click_power_scale'] # Умножаем силу клика на константу.
        self.core.brs_power += self.brs_power
        self.core.save()

        self.lvl += 1
        #self.power *= 2
        if self.type == 2:
            self.brs_power += 0.01
        elif self.type == 1:
            self.power += 10 + self.power * BOOST_TYPE_VALUES[self.type]['auto_click_power_scale']
        else:
            self.power *= 2

        self.price *= BOOST_TYPE_VALUES[self.type]['price_scale']

        self.save()

        return old_boost_stats, self

