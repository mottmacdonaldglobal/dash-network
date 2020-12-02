import React, {Component} from 'react';
import PropTypes from 'prop-types';
import OrthoNetworkD3 from '../d3/orthonetwork';

/**
 * Network graph component, using D3 and Webcola routing
 */
export default class OrthoNetwork extends Component {
    componentDidMount() {
        this.network = new OrthoNetworkD3(this.el, this.props, node => {
           const {setProps} = this.props;
           const selectedId = node && node.id;

           if (setProps) { setProps({selectedId}); }
           else { this.setState({selectedId}); }
       });
    }

    componentDidUpdate() {
        this.network.update(this.props);
    }

    render() {
        return <div id={this.props.id} ref={el => {this.el = el}} />;
    }
}

OrthoNetwork.defaultProps = {
    width: OrthoNetworkD3.DEFAULTS.width,
    height: OrthoNetworkD3.DEFAULTS.height,
    padding: OrthoNetworkD3.DEFAULTS.padding,
    margin: OrthoNetworkD3.DEFAULTS.margin,
    linkSettings: OrthoNetworkD3.DEFAULTS.linkSettings
};

OrthoNetwork.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,

    /**
     * Width of the figure to draw, in pixels
     */
    width: PropTypes.number,

    /**
     * Height of the figure to draw, in pixels
     */
    height: PropTypes.number,

    /**
     * Link settings - what edges looks like
     */
    edgeSettings: PropTypes.object,


    /**
     * The network data. Should have the form:
     *
     *   `{nodes: [node0, node1, ...], links: [link0, link1, ...]}`
     *
     * nodes have the form:
     *
     *   `{id: 'node id'[, radius: number][, color: 'css color string']}`
     *
     * `id` is required, must be unique, and is used both in links and
     * as the node text.
     * `radius` is an optional relative radius, scaled by `maxRadius`
     * `color` is an optional css color string.
     *
     * links have the form:
     *
     *   `{source: sourceId, target: targetId[, width: number]}`
     *
     * `source` and `target` are required, and must match node ids.
     * 
     * ---------------------
     * 
     * Alternatively you can define data using 'dot' format:
     * 
     */
    data: PropTypes.object.isRequired,

    /**
     * Optional version id for data, to avoid having to diff a large object
     */
    dataVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * Optional default width of links, in px
     */
    padding: PropTypes.number,

    /**
     * Optional default radius of nodes, in px
     */
    margin: PropTypes.number,

    /**
     * The currently selected node id
     */
    selectedId: PropTypes.string
};
