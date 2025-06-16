import psutil
import platform
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import time
from collections import deque
import os

# Number of seconds of CPU usage to display
HISTORY_SECONDS = 60
REFRESH_INTERVAL = 1000  # in milliseconds (1000 = 1 second)

# Deque to store CPU usage history
cpu_history = deque(maxlen=HISTORY_SECONDS)

# Clear console
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

# CPU info printout
def print_cpu_info():
    clear_screen()
    freq = psutil.cpu_freq()
    print(f"System        : {platform.system()} {platform.machine()}")
    print(f"Processor     : {platform.processor()}")
    print(f"Logical Cores : {psutil.cpu_count(logical=True)}")
    print(f"Physical Cores: {psutil.cpu_count(logical=False)}")
    print(f"CPU Frequency : {freq.current:.2f} MHz (min: {freq.min}, max: {freq.max})")
    print(f"Timestamp     : {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Per-core usage
    usage = psutil.cpu_percent(percpu=True)
    print("Per-Core Usage:")
    for i, core in enumerate(usage):
        print(f"  Core {i}: {core}%")

# Live plot update function
def update_plot(frame):
    cpu = psutil.cpu_percent()
    cpu_history.append(cpu)
    
    line.set_data(range(len(cpu_history)), list(cpu_history))
    ax.relim()
    ax.autoscale_view()
    
    print_cpu_info()
    return line,

# Set up plot
fig, ax = plt.subplots()
line, = ax.plot([], [], lw=2)
ax.set_title("Real-Time CPU Usage (%)")
ax.set_xlabel("Time (seconds ago)")
ax.set_ylabel("CPU Usage %")
ax.set_ylim(0, 100)
ax.set_xlim(0, HISTORY_SECONDS)
plt.grid(True)

# Animate
ani = animation.FuncAnimation(
    fig, update_plot, interval=REFRESH_INTERVAL, blit=True
)

plt.tight_layout()
plt.show()
