import pandas as pd
import json

input_csv_file = "ecu_incendios.csv"
output_json_file = "ecu_incendios.json"

data = pd.read_csv(input_csv_file, encoding="latin-1", sep=";")

json_data = data.to_dict(orient="records")

with open(output_json_file, "w", encoding="utf-8") as json_file:
    json.dump(json_data, json_file, indent=4, ensure_ascii=False)

print("CSV convertido a JSON exitosamente. Se ha creado el archivo:", output_json_file)