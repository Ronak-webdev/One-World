import logging
from pathlib import Path
from audio_separator.separator import Separator

log_formatter = logging.Formatter(fmt="%(asctime)s.%(msecs)03d - %(levelname)s - %(module)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
sep = Separator(log_level=logging.DEBUG, log_formatter=log_formatter, output_dir=str(Path('temp')/ 'outputs' / 'sep_debug.dir'))
print('Separator instantiated')
try:
    models = sep.get_simplified_model_list()
    print('models_count', len(models))
    for k,v in list(models.items())[:5]:
        print(k, v.get('Name'))
except Exception as e:
    print('sep error', e)
