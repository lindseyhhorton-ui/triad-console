import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation


def build_animation():
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.set_facecolor("black")
    fig.patch.set_facecolor("black")

    t = np.linspace(0, 60, 1000)
    theta = 2 * np.pi * t / 10
    radius = t / 5
    x = radius * np.cos(theta)
    y = radius * np.sin(theta)

    line, = ax.plot([], [], "w-", lw=1.5, alpha=0.4)
    ax.plot([-15, 15], [0, 0], "r-", lw=1, alpha=0.3)
    ax.plot([0, 0], [-15, 15], "b-", lw=1, alpha=0.3)
    glow = ax.scatter([], [], c="gold", s=100, alpha=0.8, edgecolors="white")

    ax.set_xlim(-15, 15)
    ax.set_ylim(-15, 15)
    ax.set_aspect("equal")
    ax.set_title("VP-Corridor-311.7 | Spiral Pulse 7", color="gold", fontsize=10, pad=20)
    ax.axis("off")

    def update(frame):
        idx = int((len(t) - 1) * frame / 100)
        line.set_data(x[:idx], y[:idx])

        pulse_size = 100 + 50 * np.sin(frame / 5)
        glow.set_offsets(np.c_[x[idx], y[idx]])
        glow.set_sizes([pulse_size])

        return line, glow

    animation = FuncAnimation(fig, update, frames=100, interval=40, blit=True)
    return fig, animation


if __name__ == "__main__":
    _, animation = build_animation()
    plt.show()