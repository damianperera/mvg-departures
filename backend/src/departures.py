from typing import List, Dict

DepartureProps = Dict[str, any]
TransformedDepartureProps = Dict[str, any]

def transform_to_departure_props(lst: List[Dict[str, any]]) -> List[DepartureProps]:
    return [{k: v for k, v in d.items()} for d in lst]

def transform_departures(departures: List[DepartureProps]) -> List[TransformedDepartureProps]:
    transformed_dict = {}
    
    for departure in departures:
        label = departure['label']
        destination = departure['destination']
        
        if label not in transformed_dict:
            transformed_dict[label] = {'destinations': {destination: [departure]}}
        elif destination not in transformed_dict[label]['destinations']:
            transformed_dict[label]['destinations'][destination] = [departure]
        else:
            transformed_dict[label]['destinations'][destination].append(departure)
    
    transformed_list = []
    for label, data in transformed_dict.items():
        destinations_list = [{'destination': dest, 'departures': deps} for dest, deps in data['destinations'].items()]
        transformed_list.append({'label': label, 'destinations': destinations_list})
    
    transformed_list.sort(key=lambda x: x['label'])
    
    def has_ubahn(data):
        return any(dep['transportType'] == 'UBAHN' for dest in data['destinations'] for dep in dest['departures'])
    
    transformed_list.sort(key=lambda x: -1 if has_ubahn(x) else 1)
    
    for item in transformed_list:
        item['destinations'].sort(key=lambda x: x['destination'])
        for dest in item['destinations']:
            dest['departures'].sort(key=lambda x: x['realtimeDepartureTime'])
            dest['departures'] = dest['departures'][:2]
    
    return transformed_list
