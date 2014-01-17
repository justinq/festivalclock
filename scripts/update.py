#!/usr/bin/python
'''
 Copyright (c) 2011 Justin Quillinan - http://justinq.net
 GPL version 3 or later (see http://www.gnu.org/copyleft/gpl.html)
'''

'''
Downloads all festival data and extracts relevant information.
General data to gather:
    start/end date
    genre statistics
'''

import sys
import config
import json
import datetime
from festivalsapi import FestivalsAPI

request_size = 100
load_data    = True
format_data  = True

# General statistics
genres       = {}
stats        = { 'start_date' : None,
                 'end_date'   : None,
                 'genres'     : [],
                 'palette'    : {},
                 'festivals'  : {
                     'art' : {
                         'name' : 'Art Festival',
                         'x':747.5, 'y':514.5, 'r':72.8
                         },
                     'book' : {
                         'name' : 'International Book Festival',
                         'x':810, 'y':270.4, 'r':147.6
                         },
                     'fringe' : {
                         'name' : 'Festival Fringe',
                         'x':361,   'y':418.7, 'r':295
                         },
                     'international' : {
                         'name' : 'International Festival',
                         'x':664.3, 'y':649.7, 'r':54
                         }, 
                     'jazz' : {
                         'name' : 'Jazz and Blues Festival',
                         'x':902, 'y':484.2, 'r':54.1
                         }, 
                     'mela' : {
                         'name' : 'Mela Festival',
                         'x':854, 'y':584.5, 'r':25.7
                         }, 
                     'tattoo' : {
                         'name' : 'Edinburgh Military Tattoo',
                         'x':766.7, 'y':619.6, 'r':11.4
                         }, 
                     },
                 'shows'      : {},
               }

palette_colours = [
    [217, 126, 255],
    [  0,  96,  76],
    [ 88,  30,  74],
    [250,  50,   3],
    [  0, 255, 220],
    [139,  35, 255],
    [109, 120,   0],
    [ 52,  34, 196],
    [136, 103,  98],
    [255,  50, 117],
    [207, 179,  90],
    [254,  93,  14],
    [232, 144, 134],
    [131, 236, 176],
    [  4, 113, 204],
    [255, 149,   0],
    [  0, 159,   1],
    [217, 224,  33],
    [98,  141, 169],
    [121,  35, 240],
    [ 46, 243,  67],
    [ 61,  78,   0],
    [255,  98, 112],
    [250, 255, 192],
    [240,  78,  76],
    [ 34, 181, 115],
    [  0, 255, 255],
    [255,   0, 255],

    [255,   0, 255],
    [255,   0, 255],
    [255,   0, 255],
    [255,   0, 255],
];

api = FestivalsAPI(config.access_key, config.secret_key, False)

request = { 'size' : request_size }
for festival in FestivalsAPI.FESTIVALS:
    filename = 'data/raw/'+festival+'.json'

    if load_data:
        print 'Requesting '+festival+' festival...'
        request['festival'] = festival
        festival_events = []
        i = 0
        while True:
            request['from'] = i
            data = api.getEvents(request)
            try:
                events = json.loads(data)
            except:
                sys.exit(data);

            festival_events += events
            if len(events)==0 or len(events)<request_size: break
            i += request_size
        with open(filename, 'w') as f:
            json.dump(festival_events, f)

    if format_data:
        print 'Formatting '+festival+' festival...'
        with open(filename,'r') as f:
            data = json.load(f)
            print festival, len(data)
            for e in data:
                # Add up the genres
                g = e['genre'].lower()
                # stupid hacking
                if g=='comission,visual arts': g='commission, visual arts';
                genres[g] = genres.get(g, 0) + 1
                # Check for start and end dates
                for p in e['performances']:
                    sd, ed = p['start'], p['end']
                    if stats['start_date']==None or sd < stats['start_date']:
                        stats['start_date'] = sd
                    if stats['end_date']==None or ed > stats['end_date']:
                        stats['end_date'] = ed

genres = sorted(genres, key=lambda key:genres[key])
stats['genres'] = list(genres)
print len(genres)
genres.reverse()

print 'Genres:'
for i in range(len(genres)):
    print '    ' + genres[i]
    stats['palette'][ genres[i] ] = palette_colours[i]

with open('data/stats.json', 'w') as f:
    json.dump(stats, f)

