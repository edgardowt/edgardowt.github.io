import yfinance as yf

print("--- Consultando Mercado ---")
# Buscamos Aluar
aluar = yf.Ticker("ALUA.BA").fast_info['last_price']
print(f"Aluar: ${aluar:.2f}")

# Buscamos YPF
ypf = yf.Ticker("YPFD.BA").fast_info['last_price']
print(f"YPF: ${ypf:.2f}")   