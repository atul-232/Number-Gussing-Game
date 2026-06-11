import random
from pyfiglet import Figlet
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Generate random jackpot number
jackpot = random.randint(1, 100)

# Create a clear font
f = Figlet(font="big")

# Welcome Screen
print(Fore.CYAN + "=" * 60)
print(Fore.YELLOW + "🎰 WELCOME TO THE LOTTERY GAME 🎰")
print(Fore.CYAN + "=" * 60)
print(Fore.GREEN + "Guess a number between 1 and 100")
print()

# First guess
guss = int(input(Fore.MAGENTA + "Enter the number : "))

# Game Loop
while guss != jackpot:

    print()

    if guss < jackpot:
        print(Fore.RED + "❌ WRONG GUESS")
        print(Fore.YELLOW + "📈 GUESS HIGHER")
    else:
        print(Fore.RED + "❌ WRONG GUESS")
        print(Fore.YELLOW + "📉 GUESS LOWER")

    print()
    guss = int(input(Fore.MAGENTA + "Enter the number again : "))

# Winning Screen
print()
print(Fore.GREEN + "🎉" * 20)
print(Fore.YELLOW + f.renderText("JACKPOT"))
print(Fore.GREEN + "🎉 CONGRATULATIONS! 🎉")
print(Fore.CYAN + "💰 YOU WON THE LOTTERY 💰")
print(Fore.MAGENTA + "🏆 JACKPOT HIT! 🏆")
print(Fore.GREEN + "🎉" * 20)
