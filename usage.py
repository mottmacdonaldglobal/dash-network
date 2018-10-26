import dash
from dash.dependencies import Input, Output
import dash_html_components as html

from dash_network import Network

app = dash.Dash(__name__)

app.scripts.config.serve_locally = True
app.css.config.serve_locally = True

alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
nums = '12345678'

selected_colors = ['#006', '#060', '#600', '#A80', '#A08']

def net_data(selected):
    selected_letter = selected and selected[0]

    def make_link(i, j, ids=alphabet):
        return {'source': ids[i], 'target': ids[j]}

    def not_selected(i, j):
        return selected_letter != alphabet[i] and selected_letter != alphabet[j]

    nodes = [{'id': letter} for letter in alphabet if letter != selected_letter]

    links = ([make_link(i, i - 1) for i in range(26) if not_selected(i, i - 1)] +
             [make_link(i, i - 2) for i in range(26) if not_selected(i, i - 2)])

    def add_select(prefix, suffix, external_links):
        suffix0 = suffix and suffix[0]
        new_ids = [prefix + i for i in nums]
        color = selected_colors[(len(prefix) - 1) % len(selected_colors)]
        nodes.extend([{'id': new_id, 'color': color} for new_id in new_ids])
        links.extend([make_link(i, i - 1, new_ids) for i in range(7)])
        links.extend([make_link(i, i - 2, new_ids) for i in range(7)])
        links.append({'source': new_ids[0], 'target': external_links[0]})
        links.append({'source': new_ids[1], 'target': external_links[1]})
        links.append({'source': new_ids[4], 'target': external_links[2]})
        if len(external_links) > 3:
            links.append({'source': new_ids[5], 'target': external_links[3]})
        if suffix:
            s0num = nums.index(suffix0)
            new_external = [new_ids[s0num - 1], new_ids[s0num], new_ids[(s0num + 1) % 8]]
            add_select(prefix + suffix0, suffix[1:], new_external)

    if selected:
        i = alphabet.index(selected_letter)
        neighbors = [alphabet[i - 2], alphabet[i - 1], alphabet[(i + 1) % 26], alphabet[(i + 2) % 26]]
        add_select(selected_letter, selected[1:], neighbors)

    return {
        'nodes': nodes,
        'links': links
    }

app.layout = html.Div([
    html.H2('Click a node to expand it'),
    Network(
        id='net',
        data=net_data(''),
        dataVersion=''
    ),
    html.Div(id='output')
])

@app.callback(Output('net', 'data'), [Input('net', 'selectedId')])
def update_data(selected_id):
    return net_data(selected_id)

if __name__ == '__main__':
    app.run_server(debug=True)
