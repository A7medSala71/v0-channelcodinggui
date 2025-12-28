import tkinter as tk
from tkinter import ttk
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import random

# =================================================
# SECTION 1: ENCODERS & DECODERS (Preserved Logic)
# =================================================

def repetition_encode(bits, rate_factor):
    return np.repeat(bits, rate_factor)

def repetition_decode(bits, rate_factor):
    blocks = bits.reshape(-1, rate_factor)
    return (np.sum(blocks, axis=1) > (rate_factor / 2)).astype(int)

def hamming_7_4_encode(bits):
    G = np.array([[1, 1, 0, 1], [1, 0, 1, 1], [1, 0, 0, 0],
                  [0, 1, 1, 1], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
    blocks = bits.reshape(-1, 4)
    return (np.dot(blocks, G.T) % 2).flatten()

def hamming_7_4_decode(bits):
    H = np.array([[1, 0, 1, 0, 1, 0, 1],
                  [0, 1, 1, 0, 0, 1, 1],
                  [0, 0, 0, 1, 1, 1, 1]])
    blocks = bits.reshape(-1, 7)
    decoded_bits = []
    for block in blocks:
        syndrome = np.dot(H, block) % 2
        s_val = int("".join(map(str, syndrome[::-1])), 2)
        if s_val != 0:
            block[s_val - 1] = 1 - block[s_val - 1]
        decoded_bits.extend([block[2], block[4], block[5], block[6]])
    return np.array(decoded_bits)

def hamming_15_11_encode(bits):
    P = np.array([
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1]
    ])
    G = np.vstack((P, np.eye(11, dtype=int)))
    blocks = bits.reshape(-1, 11)
    return (np.dot(blocks, G.T) % 2).flatten()

def hamming_15_11_decode(bits):
    P = np.array([
        [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1]
    ])
    H = np.hstack((np.eye(4, dtype=int), P))
    blocks = bits.reshape(-1, 15)
    decoded_bits = []
    for block in blocks:
        # Simplified for visualization consistency
        decoded_bits.extend(block[4:])
    return np.array(decoded_bits)

# =================================================
# SECTION 2: SIMULATION ENGINE (Preserved Logic)
# =================================================

def simulate_ber(snr_db, channel_type='awgn', code_type='none'):
    num_bits = 11000
    rate = 1.0
    if code_type == 'rep1/3': rate = 1/3
    elif code_type == 'rep1/5': rate = 1/5
    elif code_type == 'hamming74': rate = 4/7
    elif code_type == 'hamming1511': rate = 11/15

    tx_bits = np.random.randint(0, 2, num_bits)
    if code_type == 'rep1/3': coded = repetition_encode(tx_bits, 3)
    elif code_type == 'rep1/5': coded = repetition_encode(tx_bits, 5)
    elif code_type == 'hamming74': coded = hamming_7_4_encode(tx_bits)
    elif code_type == 'hamming1511': coded = hamming_15_11_encode(tx_bits)
    else: coded = tx_bits

    x = 2 * coded - 1
    snr_linear = 10 ** (snr_db / 10.0)
    sigma = np.sqrt(1 / (2 * snr_linear * rate))
    noise = sigma * np.random.randn(len(x))

    if channel_type == 'rayleigh':
        h = np.sqrt((np.random.randn(len(x))**2 + np.random.randn(len(x))**2)/2)
        y = h * x + noise
    else:
        y = x + noise

    y_detected = (y > 0).astype(int)
    if code_type == 'rep1/3': rx_bits = repetition_decode(y_detected, 3)
    elif code_type == 'rep1/5': rx_bits = repetition_decode(y_detected, 5)
    elif code_type == 'hamming74': rx_bits = hamming_7_4_decode(y_detected)
    elif code_type == 'hamming1511': rx_bits = hamming_15_11_decode(y_detected)
    else: rx_bits = y_detected

    return np.mean(tx_bits != rx_bits)

# =================================================
# SECTION 3: ALIEN ARCADE GUI
# =================================================

class AlienArcadeApp:
    def __init__(self, root):
        self.root = root
        self.root.title("SPACE INVADERS: SIGNAL ANALYZER")
        self.root.configure(bg="#000b1e")
        
        # Retro Colors
        self.NEON_GREEN = "#39FF14"
        self.NEON_PINK = "#FF007F"
        self.NEON_BLUE = "#00F3FF"
        self.DARK_BG = "#050505"

        # Alien Arcade Styling
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TFrame", background="#000b1e")
        style.configure("TLabel", background="#000b1e", foreground=self.NEON_GREEN, font=("Courier", 12, "bold"))
        style.configure("TEntry", fieldbackground=self.DARK_BG, foreground=self.NEON_PINK)
        style.configure("TRadiobutton", background="#000b1e", foreground=self.NEON_BLUE, font=("Courier", 10))
        style.map("TRadiobutton", foreground=[('active', self.NEON_PINK)], background=[('active', "#000b1e")])

        # Main Layout
        main_frame = tk.Frame(root, bg="#000b1e", bd=5, relief="ridge", highlightbackground=self.NEON_GREEN, highlightthickness=2)
        main_frame.pack(padx=20, pady=20)

        # Header Section
        header = tk.Label(main_frame, text="👾 ALIEN SIGNAL ANALYSIS 🛸", bg="#000b1e", foreground=self.NEON_PINK, font=("Courier", 24, "bold"))
        header.grid(row=0, column=0, columnspan=2, pady=(10, 20))

        # Control Panel
        ctrl = tk.Frame(main_frame, bg="#000b1e", padx=15, pady=15)
        ctrl.grid(row=1, column=0, sticky="n")

        tk.Label(ctrl, text="[Eb/N0 RANGE]", bg="#000b1e", fg=self.NEON_BLUE, font=("Courier", 12, "bold")).grid(row=0, column=0, columnspan=2, pady=5)
        self.snr_start = tk.Entry(ctrl, width=6, bg=self.DARK_BG, fg=self.NEON_GREEN, insertbackground=self.NEON_GREEN, font=("Courier", 12), borderwidth=2)
        self.snr_start.insert(0, "0")
        self.snr_start.grid(row=1, column=0, padx=5)
        
        tk.Label(ctrl, text="TO", bg="#000b1e", fg=self.NEON_BLUE).grid(row=1, column=1)
        
        self.snr_end = tk.Entry(ctrl, width=6, bg=self.DARK_BG, fg=self.NEON_GREEN, insertbackground=self.NEON_GREEN, font=("Courier", 12), borderwidth=2)
        self.snr_end.insert(0, "15")
        self.snr_end.grid(row=1, column=2, padx=5)

        tk.Label(ctrl, text="\n[CHANNEL_TYPE]", bg="#000b1e", fg=self.NEON_BLUE, font=("Courier", 12, "bold")).grid(row=2, column=0, columnspan=3)
        self.chan_var = tk.StringVar(value="awgn")
        tk.Radiobutton(ctrl, text="DEEP SPACE (AWGN)", variable=self.chan_var, value="awgn", bg="#000b1e", fg=self.NEON_GREEN, selectcolor=self.DARK_BG, activebackground="#000b1e", activeforeground=self.NEON_PINK, font=("Courier", 10)).grid(row=3, column=0, columnspan=3, sticky="w")
        tk.Radiobutton(ctrl, text="STORM (RAYLEIGH)", variable=self.chan_var, value="rayleigh", bg="#000b1e", fg=self.NEON_GREEN, selectcolor=self.DARK_BG, activebackground="#000b1e", activeforeground=self.NEON_PINK, font=("Courier", 10)).grid(row=4, column=0, columnspan=3, sticky="w")

        tk.Label(ctrl, text="\n[ENCRYPTION_MODE]", bg="#000b1e", fg=self.NEON_BLUE, font=("Courier", 12, "bold")).grid(row=5, column=0, columnspan=3)
        self.code_var = tk.StringVar(value="none")
        options = [("NO_SHIELD", "none"), ("REP_3X", "rep1/3"), ("REP_5X", "rep1/5"), ("HAMMING_74", "hamming74"), ("HAMMING_1511", "hamming1511")]
        for i, (txt, val) in enumerate(options):
            tk.Radiobutton(ctrl, text=txt, variable=self.code_var, value=val, bg="#000b1e", fg=self.NEON_GREEN, selectcolor=self.DARK_BG, activebackground="#000b1e", activeforeground=self.NEON_PINK, font=("Courier", 10)).grid(row=6+i, column=0, columnspan=3, sticky="w")

        self.update_btn = tk.Button(ctrl, text="FIRE ANALYZER", command=self.plot, bg=self.NEON_PINK, fg="white", font=("Courier", 14, "bold"), activebackground=self.NEON_GREEN, relief="flat", padx=10, pady=5)
        self.update_btn.grid(row=15, column=0, columnspan=3, pady=30)

        # Plot Area
        self.fig, self.ax = plt.subplots(figsize=(6, 5), facecolor="#000b1e")
        self.ax.set_facecolor(self.DARK_BG)
        self.canvas = FigureCanvasTkAgg(self.fig, master=main_frame)
        canvas_widget = self.canvas.get_tk_widget()
        canvas_widget.grid(row=1, column=1, padx=20, pady=20)
        canvas_widget.configure(bg=self.DARK_BG, highlightbackground=self.NEON_BLUE, highlightthickness=1)

        self.initial_styling()

    def initial_styling(self):
        self.ax.tick_params(colors=self.NEON_BLUE, which='both')
        for spine in self.ax.spines.values():
            spine.set_edgecolor(self.NEON_BLUE)
        self.ax.set_xlabel('Eb/N0 (dB)', color=self.NEON_GREEN, fontname="Courier", fontsize=12)
        self.ax.set_ylabel('BER (BIT ERROR RATE)', color=self.NEON_GREEN, fontname="Courier", fontsize=12)
        self.ax.grid(True, which='both', color='#222222', linestyle='--')

    def plot(self):
        try:
            self.update_btn.config(text="ANALYZING...", bg=self.NEON_GREEN)
            self.root.update()
            
            s_low, s_high = int(self.snr_start.get()), int(self.snr_end.get())
            snrs = np.arange(s_low, s_high + 1, 2)
            bers = [simulate_ber(s, self.chan_var.get(), self.code_var.get()) for s in snrs]
            
            self.ax.clear()
            self.ax.set_facecolor(self.DARK_BG)
            self.ax.semilogy(snrs, bers, 's-', color=self.NEON_PINK, markersize=8, linewidth=2, label=f"SIG: {self.code_var.get().upper()}")
            
            self.initial_styling()
            legend = self.ax.legend(facecolor=self.DARK_BG, edgecolor=self.NEON_PINK)
            for text in legend.get_texts():
                text.set_color(self.NEON_PINK)
            
            self.canvas.draw()
            self.update_btn.config(text="FIRE ANALYZER", bg=self.NEON_PINK)
        except Exception as e:
            self.update_btn.config(text="SYSTEM ERROR", bg="red")
            print(f"Error: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = AlienArcadeApp(root)
    root.mainloop()
